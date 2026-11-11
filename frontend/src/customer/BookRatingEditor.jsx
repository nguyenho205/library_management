import { useEffect, useState } from 'react'
import { ratingsApi } from '../api/ratings'
import { readError } from '../api/errors'

export default function BookRatingEditor({ bookId, borrowRecordId, existing, onSaved }) {
  const [open, setOpen] = useState(false)
  const [score, setScore] = useState(existing?.score || 0)
  const [comment, setComment] = useState(existing?.comment || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setScore(existing?.score || 0)
    setComment(existing?.comment || '')
  }, [existing?.score, existing?.comment])

  const submit = async (event) => {
    event.preventDefault()
    if (!score) return setError('Vui lòng chọn số sao trước khi gửi.')
    setBusy(true)
    setError('')
    try {
      await ratingsApi.save(bookId, { borrowRecordId, score, comment })
      setOpen(false)
      onSaved?.()
    } catch (err) {
      setError(readError(err) || 'Không lưu được đánh giá. Vui lòng thử lại.')
    } finally {
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <button className="book-rating-open" type="button" onClick={() => setOpen(true)}>
        <span aria-hidden="true">{existing ? '★'.repeat(existing.score) : '☆'}</span>
        {existing ? 'Sửa đánh giá' : 'Đánh giá sách'}
      </button>
    )
  }

  return (
    <form className="book-rating-editor" onSubmit={submit}>
      <div className="book-rating-editor__top"><strong>{existing ? 'Cập nhật đánh giá' : 'Bạn thấy cuốn sách này thế nào?'}</strong><button type="button" onClick={() => setOpen(false)} aria-label="Đóng">×</button></div>
      <div className="book-rating-stars" role="radiogroup" aria-label="Chọn số sao">
        {[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" role="radio" aria-checked={score === value} aria-label={`${value} sao`} className={value <= score ? 'is-selected' : ''} onClick={() => setScore(value)}>★</button>)}
      </div>
      <textarea maxLength={1000} value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Chia sẻ cảm nhận của bạn (không bắt buộc)" />
      {error && <p className="book-rating-editor__error">{error}</p>}
      <div className="book-rating-editor__actions"><span>{comment.length}/1000</span><button type="submit" disabled={busy || !score}>{busy ? 'Đang lưu…' : 'Lưu đánh giá'}</button></div>
    </form>
  )
}
