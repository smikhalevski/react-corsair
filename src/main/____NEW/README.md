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







const router = new Router({
ssr: { stateStringifier }
});

// client
startSSRHydration(router, location, { stateParser });





router.navigate(location);



RouteMatch { route, params }
RouteState { status, data, error, url } // marshalled
RouteContent { component, state }
Slot { router, routeMatch, routeContent }





createRoute('/foo', props => redirect(loginRoute.getLocation({ url: props.router.history.url }))
























