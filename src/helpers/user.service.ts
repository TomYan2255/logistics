import { Observable } from 'rxjs/Rx';
// import { AsyncStorage } from "react-native";
import { RoleType } from '../domain/core';
// import Storage from 'react-native-storage';
import * as Parse from 'parse/react-native';

class UserService {
  private static ParseInstallation: any;

  /** 當前使用者 */
  currentUser: Parse.User;
  currentUserPsw: string; // cache for offline unlock

  /** 使用者資訊 */
  storage = null;

  isAdmin = false;

  constructor() { }

  checkUserPermission(user?: Parse.User) {
    if (!user) {
      this.isAdmin = false;
      return Observable.of(false);
    }

    const checkUserPermission$ = Observable.fromPromise(this.getRole(query => query.equalTo('name', RoleType.ADMINISTRATOR)))
      .concatMap((role: any) => {
        const query = role.getUsers().query();
        query.equalTo('objectId', user.id);
        return query.first();
      })
      .map(_user => this.isAdmin = !!_user);
    return checkUserPermission$;
  }

  /** 登入 Parse Server */
  logIn(args: {
    username: string,
    password: string
  }) {
    const login$ = Observable.fromPromise(Parse.User.logIn(args.username, args.password))
      .concatMap((user: any) => this.checkUserPermission(user))
      .map(() => {
        const user = Parse.User.current();
        if (!user) {
          return false;
        }
        // this.storage['sessionToken'] = user.getSessionToken();
        // this.storage['rememberMe'] = args.rememberMe || false;
        this.currentUser = user;
        this.currentUserPsw = args.password;
        // if (args.rememberMe) {
        //   localStorage.setItem('USER_INFO', JSON.stringify(this.storage));
        // } else {
        //   sessionStorage.setItem('USER_INFO', JSON.stringify(this.storage));
        // }
        return true;
      })
      .toPromise();
    return login$;
  }

  logInByEmail(args: {
    email: string,
    password: string
  }) {
    // const query = new Parse.Query('Site');
    // query.find().then(console.log);

    const login$ = Observable.fromPromise(this.getUser(query => query.equalTo('email', args.email)))
      .concatMap((user: any) => {
        if (!user) {
          throw new Error('Invalid email.');
        }
        return this.logIn({
          username: user.getUsername(),
          password: args.password
        });
      })
      .toPromise();
    return login$;
  }

  checkUserPermissionByEmail(args: {
    email: string,
    password: string
  }) {
    const login$ = Observable.fromPromise(this.getUser(query => query.equalTo('email', args.email)))
      .concatMap((user: any) => {
        if (!user) {
          throw new Error('Invalid email.');
        }
        return this.fakeLoginForCheckAccount({
          username: user.getUsername(),
          password: args.password
        });
      })
      .toPromise();
    return login$;
  }

  fakeLoginForCheckAccount(args: {
    username: string,
    password: string
  }) {
    const login$ = Observable.fromPromise(Parse.User.logIn(args.username, args.password))
      .concatMap((user: any) => this.checkUserPermission(user)).toPromise();
    return login$;
  }


  logOut() {
    this.storage = {};
    this.currentUser = undefined;
    // if (this.storage['rememberMe']) {
    //   localStorage.removeItem('USER_INFO');
    // } else {
    //   sessionStorage.removeItem('USER_INFO');
    // }
    return Parse.User.logOut();
  }

  checkLogInStatus(): Promise<boolean> {

    const sessionToken = this.storage['sessionToken'];
    if (!sessionToken) {
      return Observable.of(false).toPromise();
    }

    const check$ = Observable.fromPromise(Parse.User.become(sessionToken))
      // .do(data => console.log(data))
      .map((user: any) => this.currentUser = user)
      .concatMap(user => this.checkUserPermission(this.currentUser))
      .map(() => !!this.currentUser)
      .toPromise();
    return check$;
  }

  getUser(filter?: (query: Parse.Query<Parse.User>) => void): Parse.Promise<Parse.User> {
    const query = new Parse.Query(Parse.User);
    if (filter) {
      filter(query);
    }
    return query.first();
  }

  getRole(filter?: (query: Parse.Query<Parse.Role>) => void) {
    const query = new Parse.Query(Parse.Role);
    if (filter) {
      filter(query);
    }
    return query.first();
  }

}

export default new UserService();
