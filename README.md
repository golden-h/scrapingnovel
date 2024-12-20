# Scraping Novel System

## System Overview

Chức năng scraping dữ liệu truyện từ trang web truyện trung quốc, thêm tính năng tự động đẩy text sang chagpt để dịch, nhận bản dịch và lưu trữ local. Sau khi chỉnh sửa bản dịch bằng tay thì đẩy lên truyện city.

## Chuẩn bị:

### Tools chính
- Pull code về
- Bật IDE
- Bật terminal
- cd tới thư mục scrapingnovel
- npm install

### Chrome Extension bổ trợ
- Pull thêm code từ repo https://github.com/golden-h/chrome-extension
- Pull về đâu cũng được
- Bật chrome or edge
- Truy cập: edge://extensions/
- Check bật developer mode ở bên trái, hoặc đâu đó
- Bấm load unpacked -> Tìm folder chrome-extension và open
- Khi này extentions "Novel Translator" sẽ hiện ở danh sách extentions 

### Tạo link trên truyencity
- Vào https://truyencity.com/admin/stories/create
- Tạo một truyện mới để làm đường dẫn cho hệ thống post truyện
- Khi có link truyện thì vào chrome-extension\config.json (đổi tên file sample_config.json -> config.json) -> Điền link vào url và lưu

*Chú ý: Mỗi lần thay đổi code extension ví dụ khi làm việc với một truyện mới, phải reload lại extension bằng cách vào edge://extensions/ -> tìm đến "Novel Translator" -> bấm nút reload.

## Sử dụng
*Điều kiện: Trên browser phải đăng nhập sẵn vào chatgpt có plus và truyencity.com

1. Trong terminal cd tới thư mục scrapingnovel
2. npm run dev
3. Truy cập localhost:3000
4. Điền link truyện ở trang uushanku (hiện tại mới chỉ support trang này)
5. Bấm get chapters
6. Chờ load xong tất cả các chapters, khoảng 5-10s một chapter * XXX chapters
7. Khi load xong thì bấm viewchapters
8. Hiện danh sách chapters
9. Bấm một chapter, khi này sẽ hiển thị bản raw tiếng Trung được scraped về
10. Xem ở góc dưới bên phải có hiện 2 button "translate with chagpt" và "post to truyencity" không. Nếu không thì reload trang.
11. Bấm "translate with chagpt" và chờ. Kết quả sẽ được tự động lấy về và dán vào khung translated và báo hoàn thành.
12. Bấm "post to truyencity" sẽ tự động post bản dịch về truyện city. Nếu hoàn thành sẽ trở lại trang list và có tag "translated" "done"

*Khi tool đang chạy auto thì không nên tương tác gì với màn hình để tránh lỗi


#ROAD MAP
- [x] Module cho uushanku
- [ ] Bổ sung module cho ranwenla
- [ ] Bổ sung module cho du11du
- [ ] Dịch bằng llm API
- [ ] Quản lý user sử dụng
- [ ] 
- [ ] 