from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..security import (
    verify_password, create_access_token, hash_password, get_current_user
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


# ============================================================
# DEMO LOGIN — accepts ANY email and ANY password, no checks.
# If the user doesn't exist yet it is auto-created on the fly.
# ============================================================
@router.post("/login", response_model=schemas.TokenResponse)
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    # Normalise email; fall back to a default if blank
    email = (payload.email or "demo@agency.gov").strip().lower()

    # Look up existing user (case-insensitive)
    user = db.query(models.User).filter(models.User.email == email).first()

    if user is None:
        # Auto-create a new user for any email — no validation
        name_part = email.split("@")[0] if "@" in email else email
        full_name = name_part.replace(".", " ").replace("_", " ").title() or "Demo Investigator"
        user = models.User(
            email=email,
            full_name=full_name,
            hashed_password=hash_password(payload.password or "demo123"),
            role="investigator",
            must_change_password=False,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Always clear the forced-password-change flag so the user is never
    # redirected to the change-password page.
    if user.must_change_password:
        user.must_change_password = False
        db.commit()

    # Issue JWT — NO password verification at all
    token = create_access_token(user.id)
    db.add(models.AuditLog(
        user_id=user.id,
        action="login",
        details=f"{user.email} logged in (demo mode)",
    ))
    db.commit()

    return schemas.TokenResponse(
        access_token=token,
        must_change_password=False,
        user_id=user.id,
        full_name=user.full_name,
    )


@router.get("/me", response_model=schemas.UserOut)
def me(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.must_change_password:
        current_user.must_change_password = False
        db.add(current_user)
        db.commit()
        db.refresh(current_user)
    return current_user


@router.post("/change-password")
def change_password(
    payload: schemas.ChangePasswordRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # In demo mode accept any current password
    current_user.hashed_password = hash_password(payload.new_password)
    current_user.must_change_password = False
    db.add(current_user)
    db.add(models.AuditLog(user_id=current_user.id, action="change_password", details="Password changed"))
    db.commit()
    return {"detail": "Password updated successfully"}
