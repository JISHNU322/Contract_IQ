# pyrefly: ignore [missing-import]
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import auth, contracts, chat, graph, risks

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

# CORS middleware configuration (allows local testing with frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production requirements
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(contracts.router, prefix=f"{settings.API_V1_STR}/contracts", tags=["contracts"])
app.include_router(chat.router, prefix=settings.API_V1_STR, tags=["chat"])
app.include_router(graph.router, prefix=settings.API_V1_STR, tags=["graph"])
app.include_router(risks.router, prefix=settings.API_V1_STR, tags=["risks"])

@app.get("/health")
def health_check():
    return {"status": "ok", "project": settings.PROJECT_NAME}