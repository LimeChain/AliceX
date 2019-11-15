import {db} from './index';

// todo: check that address is valid before firing any query
export default new class Account {
    async upsertAccount(account) {
        return db
            .collection('accounts')
            .doc(account.address)
            .set(account, {
                merge: true
            });
    }

    async getAccount(address) {
        return db
            .collection('accounts')
            .doc(address)
            .get()
            .then(snapshot => {
                if(snapshot.exists) {
                    return snapshot.data();
                }
                return null;
            });
    }

    async getFirebaseMessagingTokenForAccount(address) {
        return this.getAccount(address)
            .then(account => {
                if(account && account.firebaseMessagingToken) {
                    return account.firebaseMessagingToken;
                }
                return null;
            });
    }
}
