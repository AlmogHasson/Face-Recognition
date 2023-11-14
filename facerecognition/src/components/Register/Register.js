import React from 'react';
import { decodeAndStoreJWT } from '../../common/decode-jwt';

class Register extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            email: '',
            psw: '',
            name: ''
        }
    }
    onNameChange = (e) => {
        this.setState({ name: e.target.value })
    }

    onEmailChange = (e) => {
        this.setState({ email: e.target.value })
    }

    onPswChange = (e) => {
        this.setState({ psw: e.target.value })
    }

    onSubmit = () => {
        this.props.setIsLoading(true)
        fetch('https://face-recognition-api-n3yg.onrender.com/register', {
            method: 'post',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: this.state.email,
                psw: this.state.psw,
                name: this.state.name
            })
        })
            .then(res => res.json())
            .then(res => {
                if (res?.accessToken) {
                    const user = decodeAndStoreJWT(res.accessToken);
                    this.props.loadUser(user)
                    this.props.onRouteChange('home')
                    this.props.setIsLoading(false)
                }
            })
    }

    render() {
        return (
            <article className="br3 ba b--white bg-black-70 mv4 w-100 w-50-m w-25-l shadow-5 mw6 center">
                <main className="pa4 white">
                    <div className="measure ">
                        <fieldset id="sign_up" className="ba b--transparent ph0 mh0">
                            <legend className="f1 fw6 ph0 mh0">Register</legend>
                            <div className="mt3">
                                <label className="db fw6 lh-copy f6 " htmlFor="name">Name</label>
                                <input className="pa2 input-reset ba bg-transparent white hover-bg-black b--white pointer hover-white w-100"
                                    type="text"
                                    name="name"
                                    id="name"
                                    onChange={this.onNameChange} />
                            </div>
                            <div className="mt3">
                                <label className="db fw6 lh-copy f6 " htmlFor="email-address">Email</label>
                                <input className="pa2 input-reset ba bg-transparent white hover-bg-black b--white pointer hover-white w-100"
                                    type="email"
                                    name="email-address"
                                    id="email-address"
                                    onChange={this.onEmailChange} />
                            </div>
                            <div className="mv3">
                                <label className="db fw6 lh-copy f6" htmlFor="password">Password</label>
                                <input className="pa2 input-reset ba bg-transparent white hover-bg-black b--white pointer hover-white w-100"
                                    type="password"
                                    name="password"
                                    id="password"
                                    onChange={this.onPswChange} />
                            </div>
                        </fieldset>
                        <div>
                            <input
                                onClick={this.onSubmit}
                                className="b ph3 pv2 input-reset ba b--white bg-transparent grow pointer f6 dib white"
                                type="submit"
                                value="Register" />
                        </div>
                    </div>
                </main>
            </article>
        )
    }

}

export default Register