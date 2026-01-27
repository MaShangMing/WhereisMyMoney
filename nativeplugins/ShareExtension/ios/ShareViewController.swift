import UIKit
import Social
import MobileCoreServices

/**
 * iOS Share Extension 视图控制器
 * 用于接收从其他 App 分享的支付信息
 */
class ShareViewController: SLComposeServiceViewController {
    
    // App Group 标识符（需要在 Apple Developer 后台配置）
    private let appGroupIdentifier = "group.com.whereismymoney.shared"
    
    // 分享的文本内容
    private var sharedText: String = ""
    
    // 分享的图片
    private var sharedImage: UIImage?
    
    override func isContentValid() -> Bool {
        // 验证内容有效性
        return !sharedText.isEmpty || sharedImage != nil
    }
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        // 设置标题
        self.title = "添加到账本"
        
        // 提取分享内容
        extractSharedContent()
    }
    
    override func didSelectPost() {
        // 用户点击发布按钮
        saveToAppGroup()
        
        // 完成扩展
        self.extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
    }
    
    override func configurationItems() -> [Any]! {
        // 可以在这里添加配置选项，如选择分类
        return []
    }
    
    // MARK: - 私有方法
    
    /**
     * 提取分享的内容
     */
    private func extractSharedContent() {
        guard let extensionItems = extensionContext?.inputItems as? [NSExtensionItem] else {
            return
        }
        
        for extensionItem in extensionItems {
            guard let attachments = extensionItem.attachments else { continue }
            
            for attachment in attachments {
                // 处理文本
                if attachment.hasItemConformingToTypeIdentifier(kUTTypePlainText as String) {
                    attachment.loadItem(forTypeIdentifier: kUTTypePlainText as String, options: nil) { [weak self] (data, error) in
                        if let text = data as? String {
                            DispatchQueue.main.async {
                                self?.sharedText = text
                                self?.textView.text = text
                            }
                        }
                    }
                }
                
                // 处理图片
                if attachment.hasItemConformingToTypeIdentifier(kUTTypeImage as String) {
                    attachment.loadItem(forTypeIdentifier: kUTTypeImage as String, options: nil) { [weak self] (data, error) in
                        var image: UIImage?
                        
                        if let url = data as? URL {
                            image = UIImage(contentsOfFile: url.path)
                        } else if let imageData = data as? Data {
                            image = UIImage(data: imageData)
                        } else if let img = data as? UIImage {
                            image = img
                        }
                        
                        DispatchQueue.main.async {
                            self?.sharedImage = image
                        }
                    }
                }
            }
        }
    }
    
    /**
     * 保存数据到 App Group
     * 主 App 可以从这里读取分享的内容
     */
    private func saveToAppGroup() {
        guard let userDefaults = UserDefaults(suiteName: appGroupIdentifier) else {
            return
        }
        
        // 创建分享数据
        var shareData: [String: Any] = [
            "timestamp": Date().timeIntervalSince1970,
            "text": sharedText
        ]
        
        // 如果有图片，保存到共享容器
        if let image = sharedImage,
           let imageData = image.jpegData(compressionQuality: 0.8) {
            let fileName = "shared_image_\(Int(Date().timeIntervalSince1970)).jpg"
            
            if let containerURL = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroupIdentifier) {
                let fileURL = containerURL.appendingPathComponent(fileName)
                try? imageData.write(to: fileURL)
                shareData["imagePath"] = fileName
            }
        }
        
        // 保存到 UserDefaults
        var pendingShares = userDefaults.array(forKey: "pendingShares") as? [[String: Any]] ?? []
        pendingShares.append(shareData)
        userDefaults.set(pendingShares, forKey: "pendingShares")
        userDefaults.synchronize()
    }
}
