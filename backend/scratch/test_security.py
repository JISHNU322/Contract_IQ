from app.core.security import hash_password, verify_password, create_access_token

hashed = hash_password("mypassword123")
print("Hash:", hashed)
print("Verify correct:", verify_password("mypassword123", hashed))
print("Verify wrong:", verify_password("wrongpass", hashed))

token = create_access_token(subject="1", role="viewer")
print("Token:", token)