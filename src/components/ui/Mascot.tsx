<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Onetalk Bubble</title>
  <style>
    .bubble {
      position: relative;
      width: 220px;
      height: 200px;
      background: #6C5B7B;              /* fill tím khói */
      border: 6px solid #3B2D4C;        /* stroke tím than */
      border-radius: 50%;               /* bo 100% để thành oval */
      margin: 40px auto;
    }

    .bubble::after {
      content: "";
      position: absolute;
      /* kích thước tail */
      width: 50px;
      height: 50px;
      /* đặt ở đáy, sát phải */
      bottom: 12px;
      right: 20px;
      background: #6C5B7B;
      border: 6px solid #3B2D4C;
      /* bo mềm, góc trái trên nhọn → cong theo mẫu */
      border-radius: 0 50% 50% 50%;
      transform: rotate(45deg);
    }

    /* Ví dụ thêm mắt & miệng */
    .bubble .eye {
      position: absolute;
      width: 14px; height: 14px;
      background: #3B2D4C;
      border-radius: 50%;
      top:  sixty}px; /* chỉnh nếu cần */
    }
    .bubble .eye.left  { left: 70px; }
    .bubble .eye.right { right: 70px; }

    .bubble .mouth {
      position: absolute;
      width: 40px; height: 18px;
      bottom: 70px;
      left: 50%; transform: translateX(-50%);
      border-bottom: 4px solid #3B2D4C;
      border-radius: 0 0 50% 50%;
    }
  </style>
</head>
<body>
  <div class="bubble">
    <div class="eye left"></div>
    <div class="eye right"></div>
    <div class="mouth"></div>
  </div>
</body>
</html>
