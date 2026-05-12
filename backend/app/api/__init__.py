from fastapi import APIRouter
from .auth import router as auth_router
from .modules import router as modules_router
from .topics import router as topics_router
from .tests import router as tests_router
from .labs import router as labs_router
from .progress import router as progress_router
from .teacher import router as teacher_router
from .admin import router as admin_router
from .glossary import router as glossary_router
from .comments import router as comments_router

api_router = APIRouter(prefix="/api")

api_router.include_router(auth_router)
api_router.include_router(modules_router)
api_router.include_router(topics_router)
api_router.include_router(tests_router)
api_router.include_router(labs_router)
api_router.include_router(progress_router)
api_router.include_router(teacher_router)
api_router.include_router(admin_router)
api_router.include_router(glossary_router)
api_router.include_router(comments_router)