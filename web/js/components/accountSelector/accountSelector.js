const showAccountSelector = async () => {
  try {
    const response = await fetch(`${window.webServiceUrl}/accounts`, {
      credentials: 'include',
      headers: {'Content-Type': 'application/json'}
    })
    const data = await response.json()

    if (response.ok) {
      const event = new CustomEvent('accountsLoaded', {detail: response})
      window.dispatchEvent(event)
      const accountSelector = document.getElementById('accountSelector')
      accountSelector.innerHTML = ''
      data.accounts.forEach((account) => {
        const option = document.createElement('option')
        option.value = account.id
        option.textContent = `${account.firstName} ${account.lastName}`
        accountSelector.appendChild(option)
      })
      accountSelector.classList.toggle('hidden', false)
    }
  } catch (error) {
    console.error('Error fetching accounts:', error)
  }
}

export default showAccountSelector
