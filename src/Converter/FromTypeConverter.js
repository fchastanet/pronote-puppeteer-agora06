import DateWrapper from '#pronote/Utils/DateWrapper.js'

// Define type constants
const ATTACHMENT_TYPE = {
  0: 'TYPE_URL',
  1: 'TYPE_FILE',
}

export default class FromTypeConverter {
  fromPronote(obj, valueContext = null) {
    if (obj === null || typeof obj !== 'object') {
      return null
    }
    const result = {}

    if (obj.N) {
      result.id = obj.N
    }
    if (obj.L) {
      result.name = obj.L
    }
    if (obj.G) {
      result.type = obj.G
    }
    if (obj.V) {
      if (obj.V.map) {
        result.value = obj.V.map((o) => this.convertItem(o, obj.V, valueContext))
      } else {
        result.value = this.convertItem(obj, obj.V, valueContext)
      }
      if (valueContext === 'Value') {
        return result.value
      }
    }

    return {...result}
  }

  toPronote({id, name, type} = {}) {
    const result = {}

    if (id) {
      result.N = id
    }
    if (name) {
      result.L = name
    }
    if (type) {
      result.G = type
    }

    return result
  }

  parseRange(str) {
    const content = str.substring(1, str.length - 1).split(',')
    const result = []

    for (const val of content) {
      if (val.includes('..')) {
        const index = val.indexOf('..')
        for (let i = ~~val.substring(0, index); i <= ~~val.substring(index + 2); i++) {
          result.push(i)
        }
      } else {
        result.push(~~val)
      }
    }

    return result
  }

  convertItem({_T: type, V: value} = {}, valueContext = null) {
    if (!value) {
      if (value === undefined) {
        return null
      }

      return value
    }
    if (valueContext !== null) {
      return this.convertValueContext(value, valueContext)
    }

    switch (type) {
      case 7: // Date
        return DateWrapper.parseDate(value)
      case 8: // ? (Range)
      case 11: // ? (Range)
      case 26: // ? (Range)
        return this.parseRange(value)
      case 10: // Mark / Number
        value = value.replace('|', '-')

        if (value.indexOf(',') !== -1) {
          return parseFloat(value.replace(',', '.'))
        }

        return ~~value
      case 21: // HTML content
        return value.V
      case 23: // URL
      case 24: // Object (includes Array)
      case 25: // Resource
        if (value.map) {
          return value.map((o) => this.fromPronote(o, valueContext))
        } else if (value.N || value.L) {
          return this.fromPronote(value, valueContext)
        }

        return value
      default: // unknown type
        return value
    }
  }

  convertValueContext(value, valueContext) {
    switch (valueContext) {
      case 'ListePieceJointe':
        return this.convertAttachmentType(value)
      case 'Literal':
        if (typeof value === 'string') {
          return value
        }
        if (value?._T === 21) {
          return value.V
        }
        return value?.L ? value.L : ''
      default:
        return value
    }
  }

  // Define reverse mapping for type constants
  static ATTACHMENT_TYPE_REVERSE = Object.fromEntries(
    Object.entries(FromTypeConverter.ATTACHMENT_TYPE).map(([key, value]) => [value, parseInt(key)])
  )

  convertAttachmentType(value) {
    return ATTACHMENT_TYPE['G'] || value
  }
}
