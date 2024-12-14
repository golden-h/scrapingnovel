# Scraping Novel System

## System Overview

Chức năng scraping dữ liệu truyện từ trang web truyện trung quốc, thêm tính năng tự động đẩy text sang chagpt để dịch, nhận bản dịch và lưu trữ local. Sau khi chỉnh sửa bản dịch bằng tay thì đẩy lên truyện city.

# Chuẩn bị:
## Tools chính
Pull code về

Bật IDE
Bật terminal
cd tới thư mục scrapingnovel
npm install

## Chrome Extension bổ trợ
Pull thêm code từ repo https://github.com/golden-h/chrome-extension
Pull về đâu cũng được
Bât chrome or edge
truy cập :  edge://extensions/
Check bật developer mode ở bên trái, hoặc đâu đó
Bấm load unpacked -> Tìm folder chrome-extension và open
Khi này extentions "Novel Translator" sẽ hiện ở danh sách extentions 

## Tạo link trên truyencity
vào https://truyencity.com/admin/stories/create
tạo một truyện mới để làm đường dẫn cho hệ thống post truyện.
khi có link truyện thì vào chrome-extension\config.json -> Điền link vào url và lưu
*Chú ý mỗi lần thay đổi code extension, phải reload lại extension bằng cách vào edge://extensions/ -> tìm đến "Novel Translator" -> bấm nút reload.

# Sử dụng
trong terminal cd tới thư mục scrapingnovel
npm run dev

truy cập localhost:3000

Điền link truyện ở trang uushanku (hiện tại mới chỉ support trang này)

Bấm get chapters

Chờ load xong tất cả các chapters, khoảng 5-10s một chapter * XXX chapters.

Khi load xong thì bấm vỉewchapters

Hiện danh sách chapters

Bấm một chapter, khi này sẽ hiển thị bản raw tiếng Trung được scraped về

Xem ở góc dưới bên phải có hiện 2 button "translate with chagpt" và "post to truyencity" không. Nếu không thì reload trang.

b1: bấm "translate with chagpt" và chờ. Kết quá sẽ được tự động lấy về và dán vào khung translated và báo hoàn thành.
b2: bấm "post to truyencity"  sẽ tự động post bản dịch về truyện city. nếu hoàn thành sẽ trở lại trang list và có tag "translated" "done"

