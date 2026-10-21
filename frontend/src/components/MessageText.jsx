const translations = {
  'khong tim thay ho so member cho tai khoan dang nhap': 'Không tìm thấy hồ sơ thành viên cho tài khoản đang đăng nhập.',
  'email hoac mat khau khong dung': 'Email hoặc mật khẩu không đúng.',
  'tai khoan chua xac thuc email. vui long kiem tra hop thu de xac thuc truoc khi dang nhap.': 'Tài khoản chưa xác thực email. Vui lòng kiểm tra hộp thư để xác thực trước khi đăng nhập.',
  'tai khoan da bi khoa': 'Tài khoản đã bị khóa.',
  'tai khoan khong ton tai': 'Tài khoản không tồn tại.',
  'khong tim thay tai khoan': 'Không tìm thấy tài khoản.',
  'khong tim thay tai khoan voi email nay': 'Không tìm thấy tài khoản với email này.',
  'khong tim thay ho so member cho email': 'Không tìm thấy hồ sơ thành viên cho email.',
  'khong tim thay member voi id': 'Không tìm thấy thành viên có mã',
  'khong tim thay phieu muon voi id': 'Không tìm thấy phiếu mượn có mã',
  'khong tim thay nhom quyen voi id': 'Không tìm thấy nhóm quyền có mã',
  'khong tim thay tai khoan voi id': 'Không tìm thấy tài khoản có mã',
  'ban dang muon 1 cuon sach khac. vui long tra sach truoc khi muon sach moi.': 'Bạn đang mượn một cuốn sách khác. Vui lòng trả sách trước khi mượn sách mới.',
  'sach hien da het, khong con de muon': 'Sách hiện đã hết, không còn để mượn.',
  'ban khong co quyen tra phieu muon nay': 'Bạn không có quyền trả phiếu mượn này.',
  'phieu muon nay da duoc tra truoc do': 'Phiếu mượn này đã được trả trước đó.',
  'mat khau cu khong dung': 'Mật khẩu cũ không đúng.',
  'email moi da duoc su dung boi tai khoan khac': 'Email mới đã được sử dụng bởi tài khoản khác.',
  'token khong hop le': 'Mã xác nhận không hợp lệ.',
  'token nay da duoc su dung': 'Mã xác nhận này đã được sử dụng.',
  'token khong dung muc dich su dung': 'Mã xác nhận không đúng mục đích sử dụng.',
  'token da het han': 'Mã xác nhận đã hết hạn.',
  'refresh token khong hop le hoac da het han, vui long dang nhap lai': 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.',
  'token khong phai la refresh token': 'Mã phiên không đúng loại.',
  'ten nhom quyen da ton tai': 'Tên nhóm quyền đã tồn tại.',
  'nhom quyen dang duoc gan cho tai khoan, hay go khoi tai khoan truoc khi xoa': 'Nhóm quyền đang được gán cho tài khoản. Hãy gỡ nhóm khỏi tài khoản trước khi xóa.',
  'khong the tu thay doi nhom quyen cua chinh minh': 'Không thể tự thay đổi nhóm quyền của chính mình.',
  'co nhom quyen khong ton tai': 'Có nhóm quyền không tồn tại.',
  'co ma quyen khong ton tai trong he thong': 'Có mã quyền không tồn tại trong hệ thống.',
  'isbn nay da ton tai trong he thong': 'ISBN này đã tồn tại trong hệ thống.',
  'khong tim thay the loai sach': 'Không tìm thấy thể loại sách.',
  'khong the xoa sach dang co nguoi muon': 'Không thể xóa sách đang có người mượn.',
  'file rong hoac khong ton tai': 'Tệp rỗng hoặc không tồn tại.',
  'file vuot qua dung luong cho phep (toi da 5mb)': 'Tệp vượt quá dung lượng cho phép (tối đa 5 MB).',
  'chi ho tro file dinh dang .csv': 'Chỉ hỗ trợ tệp định dạng .csv.',
  'khong the xoa sach dang co nguoi muon': 'Không thể xóa sách đang có người mượn.',
  'email nay da duoc su dung': 'Email này đã được sử dụng.',
  'ten the loai khong duoc de trong': 'Tên thể loại không được để trống.',
  'ten the loai toi da 100 ky tu': 'Tên thể loại tối đa 100 ký tự.',
  'ten nhom quyen khong duoc de trong': 'Tên nhóm quyền không được để trống.',
  'ten nhom quyen toi da 100 ky tu': 'Tên nhóm quyền tối đa 100 ký tự.',
  'mo ta toi da 255 ky tu': 'Mô tả tối đa 255 ký tự.',
  'phai chon it nhat 1 quyen': 'Phải chọn ít nhất một quyền.',
  'email khong dung dinh dang': 'Email không đúng định dạng.',
  'mat khau cu khong duoc de trong': 'Mật khẩu cũ không được để trống.',
  'mat khau moi khong duoc de trong': 'Mật khẩu mới không được để trống.',
  'mat khau khong duoc de trong': 'Mật khẩu không được để trống.',
  'email khong duoc de trong': 'Email không được để trống.',
  'ho ten khong duoc de trong': 'Họ tên không được để trống.',
  'ngay sinh phai la ngay trong qua khu': 'Ngày sinh phải là ngày trong quá khứ.',
  'ngay bat dau (dobfrom) phai truoc hoac bang ngay ket thuc (dobto)': 'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.',
  'refreshToken khong duoc de trong': 'Mã làm mới phiên đăng nhập không được để trống.',
  'maintenanceMode khong duoc de trong': 'Chế độ bảo trì không được để trống.',
  'token khong duoc de trong': 'Mã xác nhận không được để trống.',
  'mat khau toi thieu 8 ky tu, gom chu hoa, chu thuong, so va ky tu dac biet': 'Mật khẩu tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.',
  'them the loai thanh cong': 'Thêm thể loại thành công.',
  'dang nhap thanh cong': 'Đăng nhập thành công.',
  'dang xuat thanh cong': 'Đăng xuất thành công.',
  'cap token moi thanh cong': 'Cấp mã đăng nhập mới thành công.',
  'doi mat khau thanh cong': 'Đổi mật khẩu thành công.',
  'da gui email huong dan dat lai mat khau (neu email ton tai)': 'Đã gửi email hướng dẫn đặt lại mật khẩu (nếu email tồn tại).',
  'dat lai mat khau thanh cong': 'Đặt lại mật khẩu thành công.',
  'da gui email xac nhan toi dia chi email moi': 'Đã gửi email xác nhận tới địa chỉ email mới.',
  'doi email thanh cong': 'Đổi email thành công.',
  'cap nhat cau hinh thanh cong': 'Cập nhật cấu hình thành công.',
  'them sach thanh cong': 'Thêm sách thành công.',
  'cap nhat sach thanh cong': 'Cập nhật sách thành công.',
  'xoa sach thanh cong': 'Xóa sách thành công.',
  'tao member thanh cong': 'Tạo thành viên thành công.',
  'cap nhat member thanh cong': 'Cập nhật thành viên thành công.',
  'xoa member thanh cong': 'Xóa thành viên thành công.',
  'muon sach thanh cong': 'Mượn sách thành công.',
  'tra sach thanh cong': 'Trả sách thành công.',
  'tao nhom quyen thanh cong': 'Tạo nhóm quyền thành công.',
  'cap nhat nhom quyen thanh cong': 'Cập nhật nhóm quyền thành công.',
  'xoa nhom quyen thanh cong': 'Xóa nhóm quyền thành công.',
  'gan nhom quyen thanh cong': 'Gán nhóm quyền thành công.',
  'dang ky thanh cong. vui long kiem tra email va nhap ma xac thuc.': 'Đăng ký thành công. Vui lòng kiểm tra email và nhập mã xác thực.',
  'neu email ton tai va chua xac thuc, ma moi se duoc gui den hop thu cua ban.': 'Nếu email tồn tại và chưa xác thực, mã mới sẽ được gửi đến hộp thư của bạn.',
}

function normalize(text) {
  return String(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd').toLowerCase().trim()
}

export default function MessageText({ children }) {
  const text = String(children ?? '')
  const normalized = normalize(text)
  if (translations[normalized]) return translations[normalized]

  const importCount = normalized.match(/^import thanh cong (\d+) sach moi$/)
  if (importCount) return `Đã nhập thành công ${importCount[1]} sách mới.`
  const bookNotFound = normalized.match(/^khong tim thay sach voi id=(\d+)$/)
  if (bookNotFound) return `Không tìm thấy sách có mã ${bookNotFound[1]}.`
  const notFoundWithId = normalized.match(/^khong tim thay (member|phieu muon|nhom quyen|tai khoan) voi id=(\d+)$/)
  if (notFoundWithId) {
    const labels = { member: 'thành viên', 'phieu muon': 'phiếu mượn', 'nhom quyen': 'nhóm quyền', 'tai khoan': 'tài khoản' }
    return `Không tìm thấy ${labels[notFoundWithId[1]]} có mã ${notFoundWithId[2]}.`
  }
  const memberByEmail = text.match(/^Khong tim thay ho so member cho email: (.+)$/i)
  if (memberByEmail) return `Không tìm thấy hồ sơ thành viên cho email: ${memberByEmail[1]}.`
  const quantityError = text.match(/^So luong moi \((.+?)\) khong duoc nho hon so luong dang duoc muon \((.+?)\)$/i)
  if (quantityError) return `Số lượng mới (${quantityError[1]}) không được nhỏ hơn số lượng đang được mượn (${quantityError[2]}).`
  const csvError = text.match(/^Khong doc duoc noi dung file CSV: (.+)$/i)
  if (csvError) return `Không đọc được nội dung tệp CSV: ${csvError[1]}`
  const noStock = text.match(/^Sach "(.+)" hien da het, khong con de muon$/i)
  if (noStock) return `Sách "${noStock[1]}" hiện đã hết, không còn để mượn.`
  const categoryExists = normalized.match(/^the loai nay da ton tai$/)
  if (categoryExists) return 'Thể loại này đã tồn tại.'
  return text
}
