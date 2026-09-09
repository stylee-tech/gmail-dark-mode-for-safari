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
        let title = NSTextField(labelWithString: "Safari Dark Mode")
        title.font = .systemFont(ofSize: 23, weight: .semibold)
        let detail = NSTextField(wrappingLabelWithString:
            "A softer shade of Gmail, Google Search, and Sheets.\nFollows your Mac’s Dark Appearance.")
        detail.textColor = .secondaryLabelColor
        detail.alignment = .center
        statusLabel.alignment = .center
        statusLabel.setAccessibilityIdentifier("extension-status")
        settingsButton.bezelStyle = .rounded

        let stack = NSStackView(views: [icon, title, detail, statusLabel, settingsButton])
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
            statusLabel.widthAnchor.constraint(equalTo: stack.widthAnchor)
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
                    self.statusLabel.stringValue = "Enable the extension in Safari Settings. Local builds may require Allow unsigned extensions in Developer settings."
                } else if state?.isEnabled == true {
                    self.statusLabel.stringValue = "Extension is on. Allow the supported Google websites, then reload your tabs."
                } else {
                    self.statusLabel.stringValue = "Extension is off. Turn it on in Safari Settings to get started."
                }
            }
        }
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
