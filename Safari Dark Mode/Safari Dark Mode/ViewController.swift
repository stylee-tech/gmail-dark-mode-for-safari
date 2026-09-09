import Cocoa
import SafariServices

private let extensionBundleIdentifier = "dev.pavelsuzdaltsev.safaridarkmode.Extension"

final class ViewController: NSViewController {
    private let statusLabel = NSTextField(wrappingLabelWithString: "Checking Safari extension status…")
    private let statusIcon = NSImageView()
    private let guidanceLabel = NSTextField(wrappingLabelWithString: "")
    private var statusRevision = 0
    private lazy var retryButton = NSButton(title: "Check again", target: self, action: #selector(refreshStatus))
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
        statusLabel.font = .systemFont(ofSize: 17, weight: .semibold)
        statusLabel.setAccessibilityIdentifier("extension-status")
        statusIcon.setAccessibilityElement(false)
        guidanceLabel.alignment = .center
        guidanceLabel.textColor = .secondaryLabelColor
        guidanceLabel.font = .systemFont(ofSize: 13)
        retryButton.bezelStyle = .rounded
        retryButton.isHidden = true
        settingsButton.bezelStyle = .rounded
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
        let stack = NSStackView(views: [icon, title, detail, statusIcon, statusLabel, guidanceLabel, settingsButton, retryButton, modes, links])
        stack.orientation = .vertical
        stack.alignment = .centerX
        stack.spacing = 12
        stack.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(stack)
        NSLayoutConstraint.activate([
            icon.widthAnchor.constraint(equalToConstant: 48),
            icon.heightAnchor.constraint(equalToConstant: 48),
            stack.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            stack.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            stack.widthAnchor.constraint(equalTo: view.widthAnchor, constant: -48),
            detail.widthAnchor.constraint(equalTo: stack.widthAnchor),
            statusLabel.widthAnchor.constraint(equalTo: stack.widthAnchor),
            statusIcon.widthAnchor.constraint(equalToConstant: 28),
            statusIcon.heightAnchor.constraint(equalToConstant: 28),
            guidanceLabel.widthAnchor.constraint(equalTo: stack.widthAnchor),
            modes.widthAnchor.constraint(equalTo: stack.widthAnchor)
        ])
        NotificationCenter.default.addObserver(self, selector: #selector(refreshStatus),
            name: NSApplication.didBecomeActiveNotification, object: nil)
        refreshStatus()
    }

    @objc private func refreshStatus() {
        statusRevision += 1
        let revision = statusRevision
        showStatus(title: "Checking extension…", symbol: "arrow.triangle.2.circlepath", color: .secondaryLabelColor,
                   guidance: "", action: "Open Safari Extension Settings…")
        retryButton.isHidden = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 5) { [weak self] in
            guard let self, self.statusRevision == revision else { return }
            self.statusRevision += 1
            self.showUnknownStatus()
        }
        SFSafariExtensionManager.getStateOfSafariExtension(withIdentifier: extensionBundleIdentifier) { [weak self] state, error in
            DispatchQueue.main.async {
                guard let self, self.statusRevision == revision else { return }
                self.statusRevision += 1
                if error != nil || state == nil {
                    self.showUnknownStatus()
                } else if state?.isEnabled == true {
                    self.showStatus(title: "Extension enabled", symbol: "checkmark.circle.fill", color: .systemGreen,
                                    guidance: "Choose an appearance from Safari’s toolbar.\nWebsite access is managed separately in Safari Settings.",
                                    action: "Manage Website Access…")
                } else {
                    self.showStatus(title: "Turn on the extension", symbol: "power.circle", color: .secondaryLabelColor,
                                    guidance: "Enable Gmail Dark Mode for Safari in Settings > Extensions,\nthen allow Gmail, Google Sheets, and Google Search.",
                                    action: "Enable in Safari Settings…")
                }
            }
        }
    }

    private func showStatus(title: String, symbol: String, color: NSColor, guidance: String, action: String) {
        statusLabel.stringValue = title
        statusLabel.textColor = color
        statusIcon.image = NSImage(systemSymbolName: symbol, accessibilityDescription: nil)
        statusIcon.contentTintColor = color
        guidanceLabel.stringValue = guidance
        guidanceLabel.isHidden = guidance.isEmpty
        settingsButton.title = action
    }

    private func showUnknownStatus() {
        showStatus(title: "Couldn’t check extension status", symbol: "questionmark.circle", color: .secondaryLabelColor,
                   guidance: "Check again or open Safari Settings to see its current status.", action: "Open Safari Extension Settings…")
        retryButton.isHidden = false
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
                    self.statusRevision += 1
                    self.showStatus(title: "Couldn’t open Safari Settings", symbol: "exclamationmark.triangle", color: .systemOrange,
                                    guidance: "Open Safari > Settings > Extensions manually.", action: "Try Opening Settings Again…")
                }
            }
        }
    }
}
