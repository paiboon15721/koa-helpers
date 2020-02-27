exports.formatOutput = async (ctx, next) => {
  try {
    await next()
    const contentType = ctx.response.header['content-type']
    if (
      contentType &&
      contentType.indexOf('json') < 0 &&
      contentType.indexOf('plain') < 0
    )
      return
    if (ctx.status === 404 || ctx.status === 204) {
      const error = 'Not Found'
      ctx.body = {
        statusCode: ctx.status,
        error,
        message: `${ctx.status === 404 ? 'API' : 'Resource'} ${error}`,
      }
      ctx.status = 404
      return
    }
    ctx.body = {
      statusCode: ctx.status,
      data: typeof ctx.body === 'string' ? { message: ctx.body } : ctx.body,
    }
  } catch (err) {
    if (err.isBoom) {
      const { payload } = err.output
      ctx.status = payload.statusCode
      ctx.body = err.output.payload
      return
    }
    let statusCode = 500
    if (err.isJoi) {
      statusCode = 400
      ctx.status = statusCode
      ctx.body = {
        statusCode,
        error: 'Bad Request',
        message: err.message,
        details: err.details,
      }
      return
    }
    ctx.status = statusCode
    ctx.body = {
      statusCode,
      error: 'Internal Server Error',
      message: err.message,
      details: err.stack,
    }
  }
}

exports.validateBody = schema => async (ctx, next) => {
  const value = await schema.validateAsync(ctx.request.body)
  Object.assign(ctx.request.body, value)
  await next()
}

exports.validateQuery = schema => async (ctx, next) => {
  const value = await schema.validateAsync(ctx.request.query)
  Object.assign(ctx.request.query, value)
  await next()
}
