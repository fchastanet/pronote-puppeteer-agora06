
const div = document.createElement('div')
const stripTags = (html) => {
  div.innerHTML = html
  return div.textContent || div.innerText || ''
}

const timeout = async (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export {
  stripTags,
  timeout,
}
