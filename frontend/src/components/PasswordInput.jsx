import { useState } from 'react'
import { EyeIcon, EyeOffIcon } from './Icons'

export default function PasswordInput({ id, ...inputProps }) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="password-input-wrap">
      <input {...inputProps} id={id} type={visible ? 'text' : 'password'} />
      <button
        className="password-visibility-toggle"
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        aria-pressed={visible}
        aria-controls={id}
        title={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
      >
        {visible ? <EyeOffIcon width={18} height={18} /> : <EyeIcon width={18} height={18} />}
      </button>
    </div>
  )
}
