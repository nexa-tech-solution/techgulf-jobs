This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


## Chạy hằng ngày: sync job và gửi email

Mỗi ngày chỉ cần chạy một lệnh ở thư mục gốc của dự án:

```bash
npm run daily
```

Lệnh này làm lần lượt hai việc:

1. **Sync job:** lấy job mới, xóa job đã hết hạn hoặc đã gỡ khỏi trang của công ty.
2. **Gửi email:** gửi job mới cho mọi người dùng đã có hồ sơ, trừ người đã tắt trong trang hồ sơ.

### Cài đặt một lần

Thêm các biến sau vào file `.env`. File này không được commit, nên đừng đưa khóa vào chỗ khác.

```bash
GOOGLE_APPLICATION_CREDENTIALS=/duong-dan/toi/service-account.json
GMAIL_USER=techgulfjobs@gmail.com
GMAIL_APP_PASSWORD=xxxxxxxxxxxxxxxx
```

- `GOOGLE_APPLICATION_CREDENTIALS`: file service account của Firebase, dùng để đọc và ghi Firestore.
- `GMAIL_USER`: Gmail dùng để gửi.
- `GMAIL_APP_PASSWORD`: mật khẩu ứng dụng, không phải mật khẩu Gmail. Bật xác minh 2 bước cho tài khoản, rồi tạo tại [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).

Gmail cá nhân gửi được khoảng 500 người nhận mỗi ngày. Vượt mức này Google có thể tạm khóa việc gửi.

### Lần chạy đầu tiên

```bash
npm run daily -- --dry-run   # xem trước, không ghi và không gửi gì
npm run daily                # chạy thật
```

Lần chạy thật đầu tiên **không gửi email**: nó chỉ đánh dấu các job đang có là đã biết, để không ai nhận cả danh sách job cũ. Từ lần sau mới gửi.

### Ai nhận được gì

- Mọi người dùng đã có hồ sơ đều nhận email. Ai không muốn nhận có thể tắt "Email me new matching jobs" trong hồ sơ.
- Mỗi người nhận tối đa 1 email mỗi ngày, mỗi email tối đa 5 job.
- Job phải đúng quốc gia họ chọn, có ít nhất 1 kỹ năng của họ, và có cấp bậc hợp với số năm kinh nghiệm.
- Không có job phù hợp thì không gửi.

### Đọc kết quả

Cuối lần chạy sẽ có một dòng như:

```text
Sync: OK. Email: OK.
```

| Bạn thấy | Ý nghĩa | Cần làm |
| --- | --- | --- |
| `FAILED, existing jobs left untouched` | Một nguồn job bị lỗi, job cũ của nguồn đó được giữ nguyên | Thường là lỗi tạm thời, để mai chạy lại. Nếu lặp lại nhiều ngày thì kiểm tra nguồn đó |
| `First run: ... No emails on this run.` | Lần chạy đầu | Bình thường |
| `0 new jobs` | Hôm nay không có job mới | Bình thường, không có mail |
| `Sent 0, ... of 0 users` | Chưa có người dùng nào có hồ sơ | Tạo hồ sơ để thử |
| `not sent. ...` | Gửi cho người đó thất bại | Kiểm tra mật khẩu ứng dụng và giới hạn gửi của Gmail, rồi chạy lại |
| `Add GMAIL_USER and GMAIL_APP_PASSWORD to .env` | Thiếu cấu hình | Thêm vào `.env` |

Nên chạy lại ngay trong ngày nếu gửi lỗi: người đã nhận hôm đó sẽ được bỏ qua. Nếu để sang hôm sau, họ có thể nhận lại các job đó.

### Các lệnh khác

```bash
npm run sync:jobs                                  # chỉ sync job
npm run digest                                     # chỉ gửi email
npm run digest -- --dry-run                        # xem ai sẽ nhận gì, không gửi
npm run digest -- --preview=/tmp/digest.html       # xem mẫu email, không cần khóa
```

### Sửa nhanh

- Mẫu email: `scripts/email-template.mjs`
- Số job mỗi email và quy tắc khớp cấp bậc: đầu file `scripts/send-digest.mjs`
- Danh sách công ty: `SOURCES` trong `scripts/sync-jobs.mjs`

## Update jobs daily

Run this from the project root:

```bash
GOOGLE_APPLICATION_CREDENTIALS=~/.config/techgulf/service-account.json npm run sync:jobs
```

Each run adds new jobs and deletes jobs that left the employer's board, are older than `MAX_AGE_DAYS` (60 days), or belong to a company removed from `SOURCES`. Both settings are in `scripts/sync-jobs.mjs`. New jobs can take up to about 5 minutes to appear on the site.

Preview without writing anything:

```bash
npm run sync:jobs -- --dry-run
```

To also delete demo jobs (any job not created by this script), once only:

```bash
GOOGLE_APPLICATION_CREDENTIALS=~/.config/techgulf/service-account.json npm run sync:jobs -- --remove-demo
```

