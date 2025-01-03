import {initDayjs} from '../utils/dayjs'
import initCompletionRateChart from '../charts/completionRateChart'
import initOnTimeCompletionRateChart from '../charts/onTimeCompletionRateChart'
import initHomeworkLoadChart from '../charts/homeworkLoadChart'
import initHomeworkLoadPerWeekDayChart from '../charts/homeworkLoadPerWeekDayChart'
import initSubjectMetricsChart from '../charts/subjectMetricsChart'
import initHomeworksDurationChart from '../charts/homeworksDurationChart'
import initStudentSelector from '../components/filters/studentSelector'
import initDatesSelector from '../components/filters/dates'
import dayjs from 'dayjs'
import showToast from '../components/toastMessage/toastMessage'
import {CustomError} from '../utils/utils'
import {fetchWithAuth} from '../utils/fetchWithAuth'

class Dashboard {
  constructor() {
  }

  async #loadFiltersConfig() {
    try {
      const data = await fetchWithAuth(`${window.webServiceUrl}/dashboardFiltersConfig`)
      const dashboard = document.getElementById('dashboard')
      dashboard.classList.toggle('hidden', false)
      const event = new CustomEvent('filtersLoaded', {detail: data})
      window.dispatchEvent(event)
      const dashboardFilters = document.getElementById('dashboardFilters')
      dashboardFilters.classList.toggle('hidden', false)
    } catch (error) {
      console.error('Error fetching dashboard filters config:', error)
    }
  }

  #convertFiltersToQueryParams(filters) {
    const params = new URLSearchParams(filters)
    return params.toString()
  }

  init() {
    initDayjs(dayjs)
    initStudentSelector()
    initDatesSelector()
    this.#loadFiltersConfig()

    const dashboard = document.getElementById('dashboard')
    const dashboardFilters = document.getElementById('dashboardFilters')
    const dashboardGrid = document.getElementById('dashboardGrid')
    const startDateSelector = document.getElementById('startDateSelector')
    const endDateSelector = document.getElementById('endDateSelector')
    const refreshButton = document.getElementById('refreshButton')
    let minDate = null
    let maxDate = null

    window.addEventListener('userLoggedIn', () => {
      dashboard.classList.toggle('hidden', false)
      dashboardGrid.classList.toggle('hidden', false)
    })
    window.addEventListener('userLoggedOut', () => {
      dashboard.classList.toggle('hidden', true)
      dashboardFilters.classList.toggle('hidden', true)
      dashboardGrid.classList.toggle('hidden', true)

    })
    window.addEventListener('filtersLoaded', async (event) => {
      minDate = event.detail.minDate
      maxDate = event.detail.maxDate
      const filters = this.#convertFiltersToQueryParams({
        startDate: event.detail.startDate,
        endDate: event.detail.endDate,
        students: JSON.stringify(event.detail.students.map((data) => data.id))
      })
      this.#refreshedMetrics(filters)
    })

    const lastMonthButton = document.getElementById('lastMonthButton')
    lastMonthButton.addEventListener('click', () => {
      const lastMonth = dayjs().subtract(1, 'month')
      startDateSelector.value = lastMonth.startOf('month').format('YYYY-MM-DD')
      endDateSelector.value = lastMonth.endOf('month').format('YYYY-MM-DD')
      refreshButton.click()
    })

    const fullYearButton = document.getElementById('fullYearButton')
    fullYearButton.addEventListener('click', () => {
      startDateSelector.value = minDate
      endDateSelector.value = maxDate
      refreshButton.click()
    })

    refreshButton.addEventListener('click', () => {
      const startDateSelector = document.getElementById('startDateSelector')
      const endDateSelector = document.getElementById('endDateSelector')
      const studentSelector = document.getElementById('studentSelector')
      const filters = this.#convertFiltersToQueryParams({
        startDate: startDateSelector.value,
        endDate: endDateSelector.value,
        students: JSON.stringify(this.#getSelectedOptionsAsIntArray(studentSelector))
      })
      this.#refreshedMetrics(filters)
    })
  }

  #getSelectedOptionsAsIntArray(selectElement) {
    const selectedOptions = Array.from(selectElement.selectedOptions)
    return selectedOptions.map((option) => parseInt(option.value, 10))
  }

  async #refreshedMetrics(filters) {
    try {
      const response = await fetchWithAuth(
        `${window.webServiceUrl}/dashboardMetrics?${filters}`,
        {},
        {
          decodeJsonResponse: false,
          throwErrorOnResponseKO: false
        }
      )
      if ([200, 400].indexOf(response.status) === -1) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const json = await response.json()
      if (response.status === 400) {
        throw new CustomError(json.message)
      }

      document.getElementById('dashboard').classList.toggle('hidden', false)
      showToast('Dashboard filters updated', true)
      initCompletionRateChart(json)
      initOnTimeCompletionRateChart(json)
      initHomeworkLoadChart(json)
      initHomeworkLoadPerWeekDayChart(json)
      initSubjectMetricsChart(json)
      initHomeworksDurationChart(json)
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error)
      if (error instanceof CustomError) {
        showToast(`Error fetching dashboard metrics : ${error.message}`, false)
      } else {
        showToast('Error fetching dashboard metrics', false)
      }
    }
  }

}

export default Dashboard
