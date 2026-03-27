import os
from models.interview import InterviewSession, Message, MessageRole, Difficulty
from services.llm.base import BaseLLM
from prompts.system_prompt import get_system_prompt, get_report_prompt
from config import settings


# 评估关键词，用于简单难度自适应
GOOD_SIGNALS = [
    "正确", "对的", "不错", "很好", "理解到位", "回答得很好",
    "这个思路对", "说得很清楚", "完全正确", "优秀",
]
POOR_SIGNALS = [
    "不太对", "不准确", "记不住", "不太清楚", "不确定",
    "答不上来", "不太了解", "没有", "不清楚", "不知道",
]

# 上文管理阈值（消息条数）
CONTEXT_REINJECT_THRESHOLD = 12   # 超过此条数后重新注入简历
CONTEXT_TRIM_THRESHOLD = 20       # 超过此条数后裁剪旧消息
CONTEXT_KEEP_RECENT = 10          # 裁剪后保留的最近消息数


class InterviewEngine:
    def __init__(self, llm: BaseLLM, session: InterviewSession):
        self.llm = llm
        self.session = session

    def _build_system_prompt(self) -> str:
        topics_str = (
            ", ".join(self.session.topics_covered)
            if self.session.topics_covered
            else "无"
        )
        prompt_template = get_system_prompt(self.session.direction, self.session.pressure)
        return prompt_template.format(
            resume_text=self.session.resume_text or "（无简历）",
            target_company=self.session.target_company or "未指定",
            target_direction=self.session.target_direction or "未指定",
            difficulty=self.session.difficulty.value,
            topics_covered=topics_str,
            question_count=self.session.question_count,
        )

    def _build_llm_messages(self) -> list[dict]:
        messages = []

        # 如果对话过长，裁剪旧消息但保留最近的
        active_messages = self.session.messages
        if len(active_messages) > CONTEXT_TRIM_THRESHOLD:
            active_messages = active_messages[-CONTEXT_KEEP_RECENT:]

        # 如果对话达到一定长度且有简历，在消息前重新注入简历提醒
        if (
            len(self.session.messages) >= CONTEXT_REINJECT_THRESHOLD
            and self.session.resume_text
        ):
            messages.append({
                "role": "user",
                "content": f"[系统提示：以下为候选人简历内容，请在后续提问中继续参考]\n\n{self.session.resume_text}",
            })
            messages.append({
                "role": "assistant",
                "content": "收到，我会继续结合候选人简历来提问。",
            })

        for msg in active_messages:
            if msg.role == MessageRole.INTERVIEWER:
                messages.append({"role": "assistant", "content": msg.content})
            elif msg.role == MessageRole.CANDIDATE:
                messages.append({"role": "user", "content": msg.content})

        return messages

    def _load_resume_from_disk(self) -> str | None:
        """从本地磁盘加载简历（上下文丢失时的兜底方案）"""
        filepath = os.path.join(settings.DATA_DIR, "resumes", f"{self.session.session_id}.txt")
        if os.path.exists(filepath):
            with open(filepath, "r", encoding="utf-8") as f:
                return f.read()
        return None

    async def start_interview(self):
        """生成开场白"""
        if self.session.resume_text:
            user_msg = "我提供了简历，请根据简历内容开始面试。"
        else:
            user_msg = "我没有提供简历，请直接开始面试。"

        self.session.messages.append(
            Message(role=MessageRole.CANDIDATE, content=user_msg)
        )

        system_prompt = self._build_system_prompt()
        llm_messages = self._build_llm_messages()

        async for chunk in self.llm.chat_stream(llm_messages, system_prompt):
            yield chunk

        # 注意：流式输出结束后，由调用方将完整内容写入 session

    async def next_question(self, user_answer: str):
        """处理用户回答，生成下一个问题"""
        # 先记录用户回答
        self.session.messages.append(
            Message(role=MessageRole.CANDIDATE, content=user_answer)
        )

        # 检查是否结束
        if self._is_end_signal(user_answer):
            self.session.is_finished = True
            closing = "好的，面试到此结束。需要我生成面试总结报告吗？会包含问答记录、评分评价和简历优化建议。"
            self.session.messages.append(
                Message(role=MessageRole.INTERVIEWER, content=closing)
            )
            yield closing
            return

        # 更新领域覆盖（简单启发式）
        self._update_topics(user_answer)

        # 如果内存中简历为空，尝试从本地磁盘加载
        if not self.session.resume_text:
            disk_resume = self._load_resume_from_disk()
            if disk_resume:
                self.session.resume_text = disk_resume

        system_prompt = self._build_system_prompt()
        llm_messages = self._build_llm_messages()

        full_response = ""
        async for chunk in self.llm.chat_stream(llm_messages, system_prompt):
            full_response += chunk
            yield chunk

        # 记录面试官回复
        self.session.messages.append(
            Message(role=MessageRole.INTERVIEWER, content=full_response)
        )
        self.session.question_count += 1

        # 难度自适应检查
        self._check_difficulty_adjustment(full_response)

    async def generate_report(self) -> str:
        """生成面试报告"""
        # 如果内存中简历为空，尝试从本地磁盘加载
        if not self.session.resume_text:
            disk_resume = self._load_resume_from_disk()
            if disk_resume:
                self.session.resume_text = disk_resume

        # 构建对话记录
        conversation = "\n\n".join(
            [
                f"**{'面试官' if msg.role == MessageRole.INTERVIEWER else '候选人'}**: {msg.content}"
                for msg in self.session.messages
                if msg.role != MessageRole.SYSTEM
            ]
        )

        report_messages = [
            {
                "role": "user",
                "content": f"以下是面试对话记录，请生成面试报告：\n\n{conversation}",
            }
        ]

        self.session.report_content = await self.llm.chat(report_messages, get_report_prompt(self.session.direction))
        return self.session.report_content

    def _is_end_signal(self, text: str) -> bool:
        end_keywords = ["结束面试", "结束", "退出", "停止", "不面了", "到此为止"]
        text_lower = text.strip().lower()
        return any(kw in text_lower for kw in end_keywords)

    def _update_topics(self, text: str):
        topic_keywords = {
            # 嵌入式通用
            "C/C++语言": ["指针", "volatile", "内存", "malloc", "结构体", "typedef", "const", "inline"],
            "操作系统": ["调度", "进程", "线程", "内存管理", "IPC", "信号量", "mutex", "死锁", "FreeRTOS"],
            "网络通信": ["TCP", "UDP", "socket", "HTTP", "MQTT", "I2C", "SPI", "UART", "CAN", "NTP"],
            "硬件驱动": ["驱动", "中断", "DMA", "GPIO", "设备树", "probe", "字符设备", "I2C驱动", "V4L2"],
            "系统设计": ["架构", "模块", "设计", "分层", "多线程", "实时性", "可靠性", "故障"],
            "工具链": ["Makefile", "CMake", "交叉编译", "Buildroot", "gdb", "ftrace", "perf"],
            "AI辅助编程": ["AI", "Copilot", "ChatGPT", "Claude", "prompt", "代码生成", "代码审查"],
            # 具身智能
            "ROS/机器人框架": ["ROS", "ROS2", "MoveIt", "Navigation", "Gazebo", "Isaac", "rosbag", "TF", "节点", "话题"],
            "视觉感知与SLAM": ["SLAM", "ORB", "VINS", "深度估计", "目标检测", "点云", "相机标定", "PCL", "Open3D"],
            "运动控制与规划": ["运动学", "动力学", "轨迹规划", "PID", "MPC", "力控", "逆运动学", "步态", "雅可比"],
            "Sim-to-Real": ["仿真", "域随机化", "sim-to-real", "system identification", "synthetic", "Gazebo"],
            "边缘AI部署": ["TensorRT", "RKNN", "ONNX", "量化", "推理优化", "Jetson", "NPU", "边缘计算"],
        }

        text_lower = text.lower()
        for topic, keywords in topic_keywords.items():
            if any(kw.lower() in text_lower for kw in keywords):
                self.session.topics_covered.add(topic)

    def _check_difficulty_adjustment(self, response: str):
        """简单启发式难度自适应"""
        has_good = any(sig in response for sig in GOOD_SIGNALS)
        has_poor = any(sig in response for sig in POOR_SIGNALS)

        if has_good:
            self.session.consecutive_good += 1
            self.session.consecutive_poor = 0
        elif has_poor:
            self.session.consecutive_poor += 1
            self.session.consecutive_good = 0
        else:
            self.session.consecutive_good = max(0, self.session.consecutive_good - 1)
            self.session.consecutive_poor = max(0, self.session.consecutive_poor - 1)

        # 连续3次表现好 → 升档
        if self.session.consecutive_good >= 3:
            if self.session.difficulty == Difficulty.BAICAI:
                self.session.difficulty = Difficulty.SP
            elif self.session.difficulty == Difficulty.SP:
                self.session.difficulty = Difficulty.SSP
            self.session.consecutive_good = 0

        # 连续2次表现差 → 降档
        if self.session.consecutive_poor >= 2:
            if self.session.difficulty == Difficulty.SSP:
                self.session.difficulty = Difficulty.SP
            elif self.session.difficulty == Difficulty.SP:
                self.session.difficulty = Difficulty.BAICAI
            self.session.consecutive_poor = 0
