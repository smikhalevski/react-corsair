server
    loader
        notFound -> render
        redirect -> render
    render
        notFound -> set fallbackComponent to notFoundComponent, set routeState to {status: 'notFound'}, throw
        redirect -> throw

client
    loader
        notFound -> render
        redirect -> render
    render
        notFound -> throw
        redirect -> throw
