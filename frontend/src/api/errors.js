// Chuyen loi tu backend (ErrorResponse: message + fieldErrors) thanh chuoi de hien thi cho nguoi dung
export function readError(err) {
  const data = err?.response?.data
  if (data?.fieldErrors) {
    return Object.values(data.fieldErrors).join('. ')
  }
  if (data?.message) return data.message
  if (err?.response?.status === 503) return 'Hệ thống đang bảo trì. Vui lòng quay lại sau.'
  return 'Không kết nối được máy chủ. Kiểm tra backend đã chạy ở cổng 8080 chưa.'
}
