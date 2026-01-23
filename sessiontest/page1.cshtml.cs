using GleamTech.FileUltimate.AspNet;
using GleamTech.FileUltimate.AspNet.UI;
using GleamTech.IO;
using Microsoft.AspNetCore.Mvc.RazorPages;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;


namespace servertest.Pages
{

    public class IndexModel : PageModel
    {
        public FileManager fileManager { get; private set; }

        public void OnGet()
        {
            fileManager = new FileManager
            {
                DisplayLanguage = "zh-CN",
            };
            var rootFolder = new FileManagerRootFolder();
            rootFolder.Name = "公共主目录";
            rootFolder.Location = @"d:\tempcode\FileUltimate\RazorTest\htmlfiles";

            fileManager.RootFolders.Add(rootFolder);
            var accessControl = new FileManagerAccessControl();
            accessControl.Path = @"\";
            accessControl.AllowedPermissions = FileManagerPermissions.Full;
            rootFolder.AccessControls.Add(accessControl);



            var publicFolder = new FileManagerRootFolder
            {
                Name = "公共目录",
                Location = @"d:\tempcode\FileUltimate\RazorTest\htmlfiles"
            };
            fileManager.RootFolders.Add(publicFolder);
            var publicAccess = new FileManagerAccessControl
            {
                Path = @"\",
                AllowedPermissions = FileManagerPermissions.Full,
                DeniedPermissions =
                    FileManagerPermissions.Upload |
                    FileManagerPermissions.Delete |
                    FileManagerPermissions.Rename |
                    FileManagerPermissions.Cut |      // 禁止剪切
                    FileManagerPermissions.Copy |     // 禁止复制
                    FileManagerPermissions.Paste |    // 禁止粘贴
                    FileManagerPermissions.Create |
                    FileManagerPermissions.Edit
                // 保留 Download → 可浏览和下载
            };
            publicFolder.AccessControls.Add(publicAccess);


            var uploadFolder = new FileManagerRootFolder
            {
                Name = "上传目录",
                Location = @"d:\tempcode\FileUltimate\RazorTest\htmlfiles"
            };
            fileManager.RootFolders.Add(uploadFolder);
            var uploadAccess = new FileManagerAccessControl
            {
                Path = @"\",
                AllowedPermissions = FileManagerPermissions.Full
                // 不禁止任何权限 → 登录用户可上传、下载、删除、重命名、剪切/复制/粘贴
            };
            uploadFolder.AccessControls.Add(uploadAccess);



            var userName = User.Identity.Name ?? "unknown";
            var privatePath = Path.Combine(@"d:\tempcode\FileUltimate\RazorTest\htmlfiles", userName);

            if (!Directory.Exists(privatePath))
                Directory.CreateDirectory(privatePath);

            var privateFolder = new FileManagerRootFolder
            {
                Name = $"私人目录 - {userName}",
                Location = privatePath
            };
            fileManager.RootFolders.Add(privateFolder);

            // 权限：完整能力（上传/下载/删除/重命名/剪切/复制/粘贴/创建/编辑）
            var privateAccess = new FileManagerAccessControl
            {
                Path = @"\",
                AllowedPermissions = FileManagerPermissions.Full
                // 不再使用 AllowedUsers；只有当前用户登录时才添加这个 RootFolder，
                // 其他用户根本看不到这个私人目录
            };
            privateFolder.AccessControls.Add(privateAccess);

        }
    }


}
