//
//  SafariWebExtensionHandler.swift
//  Safari Dark Mode Extension
//
//  Created by Pavel Suzdaltsev on 6/11/26.
//

import SafariServices
class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {

    func beginRequest(with context: NSExtensionContext) {
        let response = NSExtensionItem()
        if #available(iOS 15.0, macOS 11.0, *) {
            response.userInfo = [ SFExtensionMessageKey: [ "ok": false ] ]
        } else {
            response.userInfo = [ "message": [ "ok": false ] ]
        }

        context.completeRequest(returningItems: [ response ], completionHandler: nil)
    }

}
