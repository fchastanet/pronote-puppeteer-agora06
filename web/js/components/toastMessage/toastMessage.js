import './toastMessage.scss'

const showToast = (message, isSuccess) => {
  if (!message) {
    return
  }
  if (!document.getElementById('toast')) {
    const toast = document.createElement('div')
    toast.id = 'toast'
    toast.className = 'toast hidden'
    document.body.appendChild(toast)
  }
  const toast = document.getElementById('toast')
  toast.textContent = message
  toast.className = `toast ${isSuccess ? 'success' : 'error'}`
  toast.classList.remove('hidden')
  setTimeout(() => {
    toast.classList.add('hidden')
  }, 3000)
}
export default showToast
