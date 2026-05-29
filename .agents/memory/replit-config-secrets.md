# Replit config can contain live secrets

During security scans of Replit projects, inspect tracked `.replit` files for `[userenv.shared]` values. Teams sometimes commit real integration credentials there instead of keeping them only in runtime secret storage, which can expose payment, messaging, or email accounts if the repository or its history leaks.