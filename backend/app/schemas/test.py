from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID


class QuestionOption(BaseModel):
    id: str
    text: str
    is_correct: bool = False


class Question(BaseModel):
    id: str
    type: str
    text: str
    options: Optional[List[QuestionOption]] = None
    matching_pairs: Optional[List[Dict[str, str]]] = None
    correct_keywords: Optional[List[str]] = None


class TestBase(BaseModel):
    shuffle_questions: bool = False
    shuffle_options: bool = True
    passing_score: int = 70


class TestCreate(TestBase):
    topic_id: UUID
    questions: List[Question]


class TestUpdate(BaseModel):
    questions: Optional[List[Question]] = None
    shuffle_questions: Optional[bool] = None
    shuffle_options: Optional[bool] = None
    passing_score: Optional[int] = None


class TestResponse(TestBase):
    id: UUID
    topic_id: UUID
    questions: List[Question]
    created_at: datetime

    class Config:
        from_attributes = True


class TestQuestionForUser(BaseModel):
    id: str
    type: str
    text: str
    options: Optional[List[Dict[str, Any]]] = None
    matching_terms: Optional[List[Dict[str, str]]] = None
    matching_definitions: Optional[List[Dict[str, str]]] = None


class TestForUser(BaseModel):
    id: UUID
    topic_id: UUID
    questions: List[TestQuestionForUser]
    passing_score: int
    time_limit: Optional[int] = None


class AnswerSingle(BaseModel):
    question_id: str
    selected_option_id: Optional[str] = None


class AnswerMultiple(BaseModel):
    question_id: str
    selected_option_ids: List[str] = []


class AnswerMatching(BaseModel):
    question_id: str
    pairs: List[Dict[str, str]] = []


class AnswerText(BaseModel):
    question_id: str
    answer_text: str


class TestSubmission(BaseModel):
    answers: List[Any]
    time_spent: int = 0


class QuestionResult(BaseModel):
    id: str
    type: str
    correct: bool
    user_answer: Any
    correct_answer: Any
    points_earned: float
    max_points: float


class TestResultDetail(BaseModel):
    question_id: str
    type: str
    correct: bool
    user_answer: Any
    correct_answer: Any
    explanation: Optional[str] = None


class TestResultResponse(BaseModel):
    attempt_id: UUID
    total_score: int
    percentage: float
    passed: bool
    passed_score: int
    time_spent: int
    details: List[TestResultDetail]
    topic_id: UUID
    created_at: datetime


class TestAttemptHistory(BaseModel):
    id: UUID
    topic_id: UUID
    score: int
    percentage: float
    passed: bool
    time_spent: int
    created_at: datetime