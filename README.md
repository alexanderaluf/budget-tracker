# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Local data and backups

Plutus is local-first and has no backend. The canonical application
document is stored in an on-device SQLite database, while profile photos and
other attachments are stored in the application's private documents directory.
All writes are serialized and committed transactionally to SQLite.

The Settings screen supports:

- ZIP export and restore for the complete JSON document plus attachments.
- JSON export and restore for all records without images or attachments.
- CSV transaction export and re-import for spreadsheet workflows.
- Import of Paisa-style version 3 JSON backup documents. Unknown collections
  and fields are preserved for forward compatibility.

Google Drive backup is intentionally not implemented yet. The local backup
document includes reserved cloud-provider metadata so a remote destination can
be added later without changing the persisted domain format.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## License

Copyright 2026 Alexander Aluf. This project is source-available under the
[PolyForm Noncommercial License 1.0.0](LICENSE).

You may view, fork, use, modify, and redistribute this code for permitted
noncommercial purposes. Every copy, fork, and redistribution must preserve the
license and the attribution notices in [NOTICE](NOTICE), identifying Alexander
Aluf as the original creator and copyright owner.

Commercial use is not permitted without prior written permission from Alexander
Aluf. To request a commercial license, contact the owner through
[GitHub](https://github.com/alexanderaluf).

This is a source-available license, not an OSI-approved open-source license.
Third-party dependencies remain subject to their own licenses.
