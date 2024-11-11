
const div = document.createElement('div')
const stripTags = (html) => {
  div.innerHTML = html
  return div.textContent || div.innerText || ''
}

export {
  stripTags
}
