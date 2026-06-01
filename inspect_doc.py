import os

doc_path = r"c:\Users\zx262\Downloads\發文範本.doc"
print(f"File exists: {os.path.exists(doc_path)}")
if os.path.exists(doc_path):
    print(f"File size: {os.path.getsize(doc_path)} bytes")
    with open(doc_path, "rb") as f:
        header = f.read(100)
        print("Header (hex):", header.hex())
        print("Header (ASCII):", header)
