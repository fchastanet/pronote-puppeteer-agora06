const showStudentSelector = async () => {
  try {
    const response = await fetch(`${window.webServiceUrl}/students`, {
      credentials: 'include',
      headers: {'Content-Type': 'application/json'}
    })
    const data = await response.json()

    if (response.ok) {
      const event = new CustomEvent('studentsLoaded', {detail: response})
      window.dispatchEvent(event)
      const studentSelector = document.getElementById('studentSelector')
      studentSelector.innerHTML = ''
      data.students.forEach((student) => {
        const option = document.createElement('option')
        option.value = student.id
        option.textContent = `${student.firstName} ${student.lastName}`
        studentSelector.appendChild(option)
      })
      studentSelector.classList.toggle('hidden', false)
    }
  } catch (error) {
    console.error('Error fetching students:', error)
  }
}

export default showStudentSelector
