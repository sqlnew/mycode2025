
using GleamTech.AspNet;
using GleamTech.AspNet.Core;
using GleamTech.Reflection;
using GleamTech.FileUltimate;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.ApplicationParts;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using Microsoft.AspNetCore.Mvc.Razor.Compilation;
using Microsoft.AspNetCore.Mvc.Razor.RuntimeCompilation;
using Microsoft.CodeAnalysis;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Primitives;
using Newtonsoft.Json;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Reflection;
using System.Xml;
using Microsoft.CodeAnalysis.CSharp.Syntax;






class Program
{
    static void Main(string[] args)
    {

        var builder = WebApplication.CreateBuilder(args);

        System.Globalization.CultureInfo.DefaultThreadCurrentCulture = System.Globalization.CultureInfo.InvariantCulture;
        System.Globalization.CultureInfo.DefaultThreadCurrentUICulture = System.Globalization.CultureInfo.InvariantCulture;

        builder.Services.AddControllersWithViews().AddRazorRuntimeCompilation();
        builder.Services.AddRazorPages().AddRazorRuntimeCompilation();

        builder.Services.AddGleamTech(); // 注册 GleamTech 服务

        // 移除默认的 PhysicalFileProvider（关闭自动监控）

        builder.Services.Configure<MvcRazorRuntimeCompilationOptions>(options =>
        {
            var contentRoot = builder.Environment.ContentRootPath;
            var physical = new PhysicalFileProvider(contentRoot);
            options.FileProviders.Clear();
            options.FileProviders.Add(new NoChangeFileProvider(physical));
        });
    

        // 注册你自定义的 RuntimeRazorRefresher
        builder.Services.AddSingleton<RazorPageRuntimeManager>();

        builder.Services.AddDistributedMemoryCache();
        builder.Services.AddSession();

        var app = builder.Build();


        // 挂载 htmlfiles 文件夹到 /html
        var htmlPath = Path.Combine(builder.Environment.ContentRootPath, "htmlfiles"); 
        app.UseStaticFiles(new StaticFileOptions
        {
            FileProvider = new PhysicalFileProvider(htmlPath),
            RequestPath = "/html"
        });


        app.UseSession();

        RazorPageRuntimeManager manager1 = app.Services.GetRequiredService<RazorPageRuntimeManager>();
        manager1.RefreshFolderAsync($@"d:\tempcode\FileUltimate\RazorTest\bin\Release\net9.0\publish\win-x64\Pages\").GetAwaiter().GetResult();
        Console.WriteLine("[Razor] 手动刷新完成，所有 Razor Pages 已重新编译。");

        //HostingInfo TemInfo= new HostingInfo();
        //TemInfo.ApplicationBinPath
        //Console.WriteLine($@"测试路径:{AssemblyInfo.GetCurrent().OriginalFilePath.Parent()}");
        //app.UseGleamTech(); // 启用 GleamTech 中间件
        // 在调用 UseGleamTech 之前，手动设置 HostingInfo
        //app.UseGleamTech(() =>
        //{
        //Set this property only if you have a valid license key, otherwise do not 
        //set it so FileUltimate runs in trial mode.  
        //FileUltimateConfiguration.Current.LicenseKey = "QQJDJLJP34...";
        //});
        // 调用改写过的版本
        app.UseGleamTechFixed();



        app.UseStaticFiles();

        app.UseRouting();

        app.UseAuthorization();


        app.MapRazorPages();

        app.MapGet("/hello", () => "Hello from .NET 9 Kestrel!");
        app.MapPost("/echo", async (HttpContext context) =>
        {
            using var reader = new StreamReader(context.Request.Body);
            var body = await reader.ReadToEndAsync();
            await context.Response.WriteAsync($"You posted: {body}");
        });

  


        app.RunAsync();

        //命令行//
        string TemUserInput = "";
        while (1 == 1)
        {
            TemUserInput = Console.ReadLine();
            if (TemUserInput == "cls")
            {
                Console.Clear();
            }
            if (TemUserInput == "exit")
            {
                System.Environment.Exit(1);
            }
            if (TemUserInput == "cmd1")
            {
                Console.WriteLine("执行命令");
            }
            if (TemUserInput == "clc")
            {
                var manager = app.Services.GetRequiredService<RazorPageRuntimeManager>();
                manager.ClearCaches();
            }
            if (TemUserInput == "recom")
            {
                var manager = app.Services.GetRequiredService<RazorPageRuntimeManager>();
                //manager.RefreshFolderAsync("Pages").GetAwaiter().GetResult();
                manager.RefreshFolderAsync($@"d:\tempcode\FileUltimate\RazorTest\bin\Debug\net9.0\Pages\").GetAwaiter().GetResult();
                Console.WriteLine("[Razor] 手动刷新完成，所有 Razor Pages 已重新编译。");
                /*
                var manager = app.Services.GetRequiredService<RazorPageRuntimeManager>();
                // 刷新整个文件夹（相对路径）
                await manager.RefreshFolderAsync("Pages");
                // 刷新整个文件夹（绝对路径）
                await manager.RefreshFolderAsync(@"C:\Projects\MyApp\Views");
                // 刷新单个文件（绝对路径）
                await manager.RefreshFileAsync(@"C:\Projects\MyApp\Pages\Index.cshtml");
                 */
            }



        } //end while

    }













    public sealed class NoChangeFileProvider : IFileProvider
    {
        private readonly IFileProvider _inner;

        public NoChangeFileProvider(IFileProvider inner)
        {
            _inner = inner;
        }

        public IDirectoryContents GetDirectoryContents(string subpath) => _inner.GetDirectoryContents(subpath);
        public IFileInfo GetFileInfo(string subpath) => _inner.GetFileInfo(subpath);

        // 不再提供文件变更通知
        public IChangeToken Watch(string filter) => NullChangeToken.Singleton;
    }



    // 给物理目录加虚拟前缀的 FileProvider
    public class PrefixedFileProvider : IFileProvider
    {
        private readonly IFileProvider _inner;
        private readonly string _prefix;

        public PrefixedFileProvider(IFileProvider inner, string prefix)
        {
            _inner = inner;
            _prefix = prefix;
        }

        public IDirectoryContents GetDirectoryContents(string subpath)
            => _inner.GetDirectoryContents(subpath.Replace(_prefix, ""));

        public IFileInfo GetFileInfo(string subpath)
            => _inner.GetFileInfo(subpath.Replace(_prefix, ""));

        public IChangeToken Watch(string filter)
            => _inner.Watch(filter.Replace(_prefix, ""));
    }




}



