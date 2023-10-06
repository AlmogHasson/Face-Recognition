# TODO:

### refresh interval
* get jwt from localstorage
* check expiration of JWT
* const refreshInterval = setInterval(() => {
        fetch(refresh)
        .catch((e) => {
            clearInterval(refreshInterval)
            redirect to login page
        })
    }, [Date.now() - jwt])
* clearInterval if refresh fails

    