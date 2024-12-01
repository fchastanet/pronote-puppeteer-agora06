const initStudentSelector = async () => {
  const studentSelector = document.getElementById('studentSelector')
  window.addEventListener('filtersLoaded', async (event) => {
    studentSelector.innerHTML = ''
    if (studentSelector.options.length > 1) {
      const option = document.createElement('option')
      option.value = 'ALL'
      option.textContent = 'All students'
      studentSelector.appendChild(option)
    }
    event.detail.students.forEach((student) => {
      const option = document.createElement('option')
      option.value = student.id
      option.textContent = `${student.firstName} ${student.lastName}`
      studentSelector.appendChild(option)
    })
    studentSelector.classList.toggle('hidden', false)
  })
}

export default initStudentSelector
