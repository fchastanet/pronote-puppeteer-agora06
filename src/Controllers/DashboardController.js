import ProcessorMetricsService from '#pronote/Services/ProcessorMetricsService.js'


export default class DashboardController {
  /** @type {ProcessorMetricsService} */
  #processorMetricsService

  constructor({
    processorMetricsService,
  }) {
    this.#processorMetricsService = processorMetricsService
  }

  dashboardFiltersConfigAction(req, res) {
    try {
      const filtersConfig = this.#processorMetricsService.dashboardFiltersConfig(req.session.user.id)
      res.json(filtersConfig)
    } catch (error) {
      console.error('Error fetching filters config:', error)
      res.status(500).json({message: 'Internal Server Error'})
    }
  }

  async dashboardMetricsAction(req, res) {
    const filters = this.#validateFilters(req, res)
    if (!filters) {
      return
    }
    try {
      const metrics = await this.#processorMetricsService.process(filters)
      res.json(metrics)
    } catch (error) {
      console.error('Error fetching metrics:', error)
      res.status(500).json({message: 'Internal Server Error'})
    }
  }

  #validateFilters(req, res) {
    try {
      return this.#processorMetricsService.validateFilters(req.query, req.session.user.id)
    } catch (error) {
      console.error('Invalid filters:', error)
      res.status(400).json({message: error.message})
      return null
    }
  }

}
