import { useEffect, useRef, useState } from 'react'
import { authApi } from '../api/auth'
import '../styles/social-signin.css'

const scriptPromises = {}
function loadScript(id, src) {
  if (!scriptPromises[id]) {
    scriptPromises[id] = new Promise((resolve, reject) => {
      const existing = document.getElementById(id)
      if (existing) { resolve(); return }
      const script = document.createElement('script')
      script.id = id
      script.src = src
      script.async = true
      script.onload = resolve
      script.onerror = () => { delete scriptPromises[id]; script.remove(); reject(new Error('Không tải được dịch vụ đăng nhập.')) }
      document.head.appendChild(script)
    })
  }
  return scriptPromises[id]
}

export default function SocialSignInButtons({ onCredential, onError, disabled = false, locale = 'vi' }) {
  const googleButton = useRef(null)
  const credentialHandler = useRef(onCredential)
  const errorHandler = useRef(onError)
  credentialHandler.current = onCredential
  errorHandler.current = onError
  const [config, setConfig] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true
    authApi.socialConfig().then((values) => { if (active) setConfig(values) })
      .catch(() => { if (active) errorHandler.current?.('Không thể tải cấu hình đăng nhập Google/Facebook.') })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!config) return undefined
    let active = true
    if (config.googleClientId) {
      loadScript('google-identity-script', 'https://accounts.google.com/gsi/client')
        .then(() => {
          if (!active || !window.google || !googleButton.current) return
          window.google.accounts.id.initialize({
            client_id: config.googleClientId,
            callback: ({ credential }) => credential && credentialHandler.current('google', credential),
          })
          googleButton.current.replaceChildren()
          window.google.accounts.id.renderButton(googleButton.current, {
            type: 'standard', theme: 'outline', size: 'large', text: 'continue_with',
            width: Math.min(340, googleButton.current.clientWidth || 300),
          })
        }).catch((err) => active && errorHandler.current?.(err.message))
    }
    if (config.facebookAppId) {
      loadScript('facebook-sdk-script', 'https://connect.facebook.net/en_US/sdk.js')
        .then(() => {
          if (!active || !window.FB) return
          window.FB.init({ appId: config.facebookAppId, cookie: false, xfbml: false, version: 'v24.0' })
          setReady(true)
        }).catch((err) => active && errorHandler.current?.(err.message))
    }
    return () => { active = false }
  }, [config])

  const facebookLogin = () => {
    if (!window.FB || disabled) return
    window.FB.login((response) => {
      const token = response?.authResponse?.accessToken
      if (token) credentialHandler.current('facebook', token)
      else errorHandler.current?.('Bạn đã đóng cửa sổ Facebook hoặc chưa cấp quyền đăng nhập.')
    }, { scope: 'public_profile,email' })
  }

  return (
    <div className="social-signin">
      <div className="social-signin__divider"><span>{locale === 'en' ? 'or continue with' : 'hoặc tiếp tục với'}</span></div>
      {config?.googleClientId ? <div className="social-signin__google" ref={googleButton} /> : (
        <button className="social-signin__facebook" type="button" disabled>{locale === 'en' ? 'Google is not configured' : 'Google chưa được cấu hình'}</button>
      )}
      {config?.facebookAppId ? (
        <button className="social-signin__facebook" type="button" onClick={facebookLogin} disabled={!ready || disabled}>
          <span className="social-signin__facebook-icon" aria-hidden="true">f</span> {locale === 'en' ? 'Continue with Facebook' : 'Tiếp tục với Facebook'}
        </button>
      ) : <button className="social-signin__facebook" type="button" disabled>{locale === 'en' ? 'Facebook is not configured' : 'Facebook chưa được cấu hình'}</button>}
    </div>
  )
}
