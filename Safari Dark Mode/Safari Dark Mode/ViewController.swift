import Cocoa
import SafariServices

private let extensionBundleIdentifier = "dev.pavelsuzdaltsev.safaridarkmode.Extension"

final class ViewController: NSViewController {
    private let statusLabel = NSTextField(wrappingLabelWithString: "Checking Safari extension status…")
    private lazy var settingsButton = NSButton(
        title: "Open Safari Extension Settings…",
        target: self,
        action: #selector(openSettings)
    )

    override func viewDidLoad() {
        super.viewDidLoad()

        let icon = NSImageView(image: NSImage(named: NSImage.applicationIconName) ?? NSImage())
        let title = NSTextField(labelWithString: "Gmail Dark Mode for Safari")
        title.font = .systemFont(ofSize: 23, weight: .semibold)
        let detail = NSTextField(wrappingLabelWithString:
            "A softer shade of Gmail, Google Search, and Sheets.\nChoose On, Off, or System in Safari’s toolbar popup.")
        detail.textColor = .secondaryLabelColor
        detail.alignment = .center
        statusLabel.alignment = .center
        statusLabel.setAccessibilityIdentifier("extension-status")
        settingsButton.bezelStyle = .rounded

        let steps = NSTextField(wrappingLabelWithString:
            "1. Open Safari Settings and enable the extension.\n2. Allow access to Gmail, Google Sheets, and Google Search.\n3. Open the extension in Safari’s toolbar to choose an appearance.")
        steps.font = .systemFont(ofSize: 13)
        let modes = NSTextField(wrappingLabelWithString:
            "On keeps dark appearance enabled. Off restores the website’s own appearance. System follows your Mac.\n\nPreferences stay on this Mac. No browsing or message data is collected. Sheets’ displayed colors change; document formatting stays intact.")
        modes.textColor = .secondaryLabelColor
        modes.font = .systemFont(ofSize: 12)
        let help = NSButton(title: "Help & Support", target: self, action: #selector(openHelp))
        let privacy = NSButton(title: "Privacy Policy", target: self, action: #selector(openPrivacy))
        help.bezelStyle = .rounded
        privacy.bezelStyle = .rounded
        let links = NSStackView(views: [help, privacy])
        links.spacing = 12
        let stack = NSStackView(views: [icon, title, detail, steps, statusLabel, settingsButton, modes, links])
        stack.orientation = .vertical
        stack.alignment = .centerX
        stack.spacing = 16
        stack.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(stack)
        NSLayoutConstraint.activate([
            icon.widthAnchor.constraint(equalToConstant: 64),
            icon.heightAnchor.constraint(equalToConstant: 64),
            stack.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            stack.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            stack.widthAnchor.constraint(equalTo: view.widthAnchor, constant: -48),
            detail.widthAnchor.constraint(equalTo: stack.widthAnchor),
            statusLabel.widthAnchor.constraint(equalTo: stack.widthAnchor),
            steps.widthAnchor.constraint(equalTo: stack.widthAnchor),
            modes.widthAnchor.constraint(equalTo: stack.widthAnchor)
        ])
        NotificationCenter.default.addObserver(self, selector: #selector(refreshStatus),
            name: NSApplication.didBecomeActiveNotification, object: nil)
        refreshStatus()
    }

    @objc private func refreshStatus() {
        SFSafariExtensionManager.getStateOfSafariExtension(withIdentifier: extensionBundleIdentifier) { [weak self] state, error in
            DispatchQueue.main.async {
                guard let self else { return }
                if error != nil || state == nil {
                    #if DEBUG
                    self.statusLabel.stringValue = "Enable the extension in Safari Settings. Local builds may require Allow unsigned extensions in Developer settings."
                    #else
                    self.statusLabel.stringValue = "Open Safari Settings > Extensions and enable Gmail Dark Mode for Safari."
                    #endif
                } else if state?.isEnabled == true {
                    self.statusLabel.stringValue = "Extension is on. Allow the supported Google websites, then reload your tabs."
                } else {
                    self.statusLabel.stringValue = "Extension is off. Turn it on in Safari Settings to get started."
                }
            }
        }
    }

    @objc private func openHelp() {
        NSWorkspace.shared.open(URL(string: "https://pavel-suzdaltsev.github.io/gmail-dark-mode-support/")!)
    }

    @objc private func openPrivacy() {
        NSWorkspace.shared.open(URL(string: "https://pavel-suzdaltsev.github.io/gmail-dark-mode-support/privacy.html")!)
    }

    @objc private func openSettings() {
        settingsButton.isEnabled = false
        SFSafariApplication.showPreferencesForExtension(withIdentifier: extensionBundleIdentifier) { [weak self] error in
            DispatchQueue.main.async {
                guard let self else { return }
                self.settingsButton.isEnabled = true
                if error != nil {
                    self.statusLabel.stringValue = "Couldn’t open Safari Settings. Open Safari > Settings > Extensions manually."
                }
            }
        }
    }
}
