import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from .config import settings


class EmailService:
    def __init__(self):
        self.smtp_host = getattr(settings, 'SMTP_HOST', 'smtp.gmail.com')
        self.smtp_port = getattr(settings, 'SMTP_PORT', 587)
        self.smtp_user = getattr(settings, 'SMTP_USER', '')
        self.smtp_password = getattr(settings, 'SMTP_PASSWORD', '')
        self.from_email = getattr(settings, 'FROM_EMAIL', 'noreply@textbook.com')
        self.enabled = bool(self.smtp_user and self.smtp_password)

    def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        if not self.enabled:
            return False

        try:
            message = MIMEMultipart('alternative')
            message['From'] = self.from_email
            message['To'] = to_email
            message['Subject'] = subject

            if text_content:
                part1 = MIMEText(text_content, 'plain')
                message.attach(part1)

            part2 = MIMEText(html_content, 'html')
            message.attach(part2)

            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.send_message(message)

            return True
        except Exception as e:
            print(f"Failed to send email: {e}")
            return False

    def send_lab_graded_notification(
        self,
        to_email: str,
        student_name: str,
        lab_title: str,
        grade: int,
        feedback: str
    ):
        subject = f"Лабораторная работа проверена: {lab_title}"
        
        html_content = f"""
        <html>
        <body>
            <h2>Ваша лабораторная работа проверена</h2>
            <p>Здравствуйте, {student_name}!</p>
            <p>Преподаватель проверил вашу работу по теме: <strong>{lab_title}</strong></p>
            <p><strong>Оценка:</strong> {grade} баллов</p>
            <p><strong>Комментарий:</strong></p>
            <p>{feedback or 'Без комментариев'}</p>
            <p>Вы можете посмотреть подробности в личном кабинете.</p>
            <hr>
            <p style="color: gray; font-size: 12px;">Это автоматическое уведомление. Пожалуйста, не отвечайте на него.</p>
        </body>
        </html>
        """
        
        return self.send_email(to_email, subject, html_content)

    def send_test_passed_notification(
        self,
        to_email: str,
        student_name: str,
        topic_title: str,
        score: int
    ):
        subject = f"Тест пройден: {topic_title}"
        
        html_content = f"""
        <html>
        <body>
            <h2>Поздравляем с прохождением теста!</h2>
            <p>Здравствуйте, {student_name}!</p>
            <p>Вы успешно прошли тест по теме: <strong>{topic_title}</strong></p>
            <p><strong>Ваш результат:</strong> {score}%</p>
            <p>Продолжайте в том же духе!</p>
            <hr>
            <p style="color: gray; font-size: 12px;">Это автоматическое уведомление. Пожалуйста, не отвечайте на него.</p>
        </body>
        </html>
        """
        
        return self.send_email(to_email, subject, html_content)

    def send_temp_password(
        self,
        to_email: str,
        student_name: str,
        temp_password: str
    ):
        subject = "Временный пароль для входа"
        html_content = (
            f"<p>Здравствуйте, {student_name}!</p>"
            f"<p>Преподаватель сбросил ваш пароль. Ваш временный пароль:</p>"
            f"<p><strong>{temp_password}</strong></p>"
            f"<p>После входа в систему смените пароль в личном кабинете.</p>"
            f"<hr><p style='color:gray;font-size:12px;'>Это автоматическое уведомление.</p>"
        )
        return self.send_email(to_email, subject, html_content)

    def send_course_completed_notification(
        self,
        to_email: str,
        student_name: str,
        completion_percentage: int
    ):
        subject = "Поздравляем с завершением курса!"
        
        html_content = f"""
        <html>
        <body>
            <h2>🎉 Поздравляем с завершением курса!</h2>
            <p>Здравствуйте, {student_name}!</p>
            <p>Вы успешно завершили изучение курса <strong>Информационные системы и технологии</strong></p>
            <p><strong>Прогресс:</strong> {completion_percentage}%</p>
            <p>Вы можете скачать сертификат о прохождении курса в личном кабинете.</p>
            <p>Благодарим за ваше усердие!</p>
            <hr>
            <p style="color: gray; font-size: 12px;">Это автоматическое уведомление. Пожалуйста, не отвечайте на него.</p>
        </body>
        </html>
        """
        
        return self.send_email(to_email, subject, html_content)


email_service = EmailService()
