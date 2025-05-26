const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
    }   
    //this returns a function which takes these parameters, as we use in expressjs middlewares
    //next is a default error handler 
}

export { asyncHandler }