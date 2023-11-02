import React from 'react';
import { decodeAndStoreJWT } from '../../common/decode-jwt';

class Signin extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            signInEmail:'',
            signInPsw: '',
          
        }
    }

     onEmailChange = (e) => {
        this.setState({signInEmail : e.target.value})
     }

     onPswChange = (e) => {
        this.setState({signInPsw : e.target.value})
     }

     onSubmit = () =>{
        fetch('https://face-recognition-api-n3yg.onrender.com/signin', {
            method:'post',
            headers : {
                'Content-Type':'application/json',
            },
            body: JSON.stringify({
                email: this.state.signInEmail,  
                psw: this.state.signInPsw
            }),
            credentials: 'include'
        })
        .then(res => res.json())
        .then(res => {
            if (res.accessToken){
                const user = decodeAndStoreJWT(res.accessToken);
                this.props.setBearer(res.accessToken)
                this.props.loadUser(user)
                this.props.onRouteChange('home')
                this.props.runInterval()
            }
        })
     }

    render() {
        const {onRouteChange}= this.props
        return (
            <article className="br3 ba b--white bg-black-80 mv4 w-100 w-50-m w-25-l shadow-5 mw6 center">
                <main className="pa4 white">
                <div className="measure">
                    <fieldset id="sign_up" className="ba b--transparent ph0 mh0">
                        <legend className="f1 fw6 ph0 mh0">Sign In</legend>
                        <div className="mt3">
                            <label className="db fw6 lh-copy f6" htmlFor="email-address">Email</label>
                            <input className="pa2 input-reset ba bg-transparent white hover-bg-black b--white pointer hover-white w-100"
                             type="email"
                             name="email-address" 
                             id="email-address"
                             autoComplete='on'
                             onChange={this.onEmailChange}
                             />
                        </div>
                        <div className="mv3">
                            <label className="db fw6 lh-copy f6" htmlFor="password">Password</label>
                            <form>
                            <input className="b pa2 input-reset ba bg-transparent  white hover-bg-black b--white pointer hover-white w-100"
                             type="password"
                             name="password"
                             autoComplete='on'
                             id="password"
                             onChange={this.onPswChange}/> 
                            </form>
                            
                        </div>
                    </fieldset>
                    <div>
                        <input
                         onClick={this.onSubmit}
                         className="b ph3 pv2 input-reset white ba b--white bg-transparent grow pointer f6 dib"
                         type="submit"
                         value="Sign in"
                         />
                    </div>
                    <div className="lh-copy mt3">
                        <p onClick={()=> onRouteChange('register')}
                           className="f6 link dim black db pointer white">Register</p>
                    </div>
                </div>
            </main>
            </article>
    )
    }

}

export default Signin