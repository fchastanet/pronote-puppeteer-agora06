import translations from '../../../translations.js'

const getUserLang = () => {
  const savedLang = localStorage.getItem('lang')
  return savedLang ? savedLang : (navigator.language.startsWith('fr') ? 'fr' : 'en')
}

const setUserLang = (lang) => {
  localStorage.setItem('lang', lang)
  location.reload()
}

const initLanguageSelector = () => {
  const userLang = getUserLang()
  document.querySelectorAll('[data-translate]').forEach((el) => {
    const key = el.getAttribute('data-translate')
    el.textContent = translations[userLang][key]
  })
  document.querySelectorAll('[data-title-translate]').forEach((el) => {
    const key = el.getAttribute('data-title-translate')
    el.title = translations[userLang][key]
  })

  document.getElementById('login').placeholder = translations[userLang].loginPlaceholder
  document.getElementById('password').placeholder = translations[userLang].passwordPlaceholder

  document.getElementById('languageSelector').value = userLang
  document.getElementById('languageSelector').addEventListener('change', (e) => {
    setUserLang(e.target.value)
  })
}

export default initLanguageSelector
