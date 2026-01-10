CREATE TABLE [chromepath](
  [myid] INTEGER PRIMARY KEY AUTOINCREMENT, 
  [fullpath] NVARCHAR(1000) NOT NULL DEFAULT '');

CREATE TABLE [ksjianli](
  [myid] INTEGER PRIMARY KEY AUTOINCREMENT, 
  [ShenFenZheng] NVARCHAR(5000) NOT NULL DEFAULT '', 
  [PaiXuId] INTEGER NOT NULL DEFAULT 0, 
  [QiShiShiJian_NianYue] NVARCHAR(50) NOT NULL DEFAULT '', 
  [JieShuShiJian_NianYue] NVARCHAR(50) NOT NULL DEFAULT '', 
  [JianLiNeiRong] NVARCHAR(5000) NOT NULL DEFAULT '');

CREATE TABLE [ksjiating](
  [myid] INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, 
  [ShenFenZheng] NVARCHAR(5000) NOT NULL DEFAULT '', 
  [PaiXuId] INTEGER NOT NULL DEFAULT 0, 
  [ChengWei] NVARCHAR(5000) NOT NULL DEFAULT '', 
  [XingMing] NVARCHAR(5000) NOT NULL DEFAULT '', 
  [ChuShengRiQi] NVARCHAR(5000) NOT NULL DEFAULT '', 
  [ZhengZhiMianMao] NVARCHAR(5000) NOT NULL DEFAULT '', 
  [GongZuoDanWeiJiZhiWu] NVARCHAR(5000) NOT NULL DEFAULT '');

CREATE TABLE [kslist](
  [myid] INTEGER PRIMARY KEY AUTOINCREMENT, 
  [ShenFenZheng] NVARCHAR(5000) NOT NULL DEFAULT '', 
  [XingMing] NVARCHAR(18) NOT NULL DEFAULT '', 
  [XingBie] NVARCHAR(2) NOT NULL DEFAULT '', 
  [ChuShengNianYue] NVARCHAR(5000) NOT NULL DEFAULT '', 
  [MinZu] NVARCHAR(5000) NOT NULL DEFAULT '', 
  [JiGuan] NVARCHAR(5000) NOT NULL DEFAULT '', 
  [ChuShengDi] NVARCHAR(5000) NOT NULL DEFAULT '', 
  [RuDangShiJian] NVARCHAR(5000) NOT NULL DEFAULT '', 
  [CanJiaGongZuoShiJian] NVARCHAR(5000) NOT NULL DEFAULT '', 
  [JianKangZhuangKuang] NVARCHAR(5000) NOT NULL DEFAULT '', 
  [ZhuanYeJiShuZhiWu] NVARCHAR(5000) NOT NULL DEFAULT '', 
  [ShuXiZhuanYeYouHeZhuanChang] NVARCHAR(5000) NOT NULL DEFAULT '', 
  [QuanRiZhiJiaoYu_XueLi] NVARCHAR(5000) NOT NULL DEFAULT '', 
  [QuanRiZhiJiaoYu_XueWei] NVARCHAR(5000) NOT NULL DEFAULT '', 
  [QuanRiZhiJiaoYu_XueLi_BiYeYuanXiaoXi] NVARCHAR(5000) NOT NULL DEFAULT '', 
  [QuanRiZhiJiaoYu_XueWei_BiYeYuanXiaoXi] NVARCHAR(5000) NOT NULL DEFAULT '', 
  [ZaiZhiJiaoYu_XueLi] NVARCHAR(5000) NOT NULL DEFAULT '', 
  [ZaiZhiJiaoYu_XueWei] NVARCHAR(5000) NOT NULL DEFAULT '', 
  [ZaiZhiJiaoYu_XueLi_BiYeYuanXiaoXi] NVARCHAR(5000) NOT NULL DEFAULT '', 
  [ZaiZhiJiaoYu_XueWei_BiYeYuanXiaoXi] NVARCHAR(5000) NOT NULL DEFAULT '', 
  [XianRenZhiWu] NVARCHAR(5000) NOT NULL DEFAULT '', 
  [NiRenZhiWu] NVARCHAR(5000) NOT NULL DEFAULT '', 
  [NiMianZhiWu] NVARCHAR(5000) NOT NULL DEFAULT '', 
  [JianLi] NVARCHAR(5000) NOT NULL DEFAULT '', 
  [JiangChengQingKuang] NVARCHAR(5000) NOT NULL DEFAULT '', 
  [NianDuKaoHeJieGuo] NVARCHAR(5000) NOT NULL DEFAULT '', 
  [RenMianLiYou] NVARCHAR(5000) NOT NULL DEFAULT '', 
  [JiaTingChengYuan] NVARCHAR(5000) NOT NULL DEFAULT '', 
  [ChengBaoDanWei] NVARCHAR(5000) NOT NULL DEFAULT '', 
  [JiSuanNianLingShiJian] NVARCHAR(5000) NOT NULL DEFAULT '', 
  [TianBiaoShiJian] NVARCHAR(5000) NOT NULL DEFAULT '', 
  [TianBiaoRen] NVARCHAR(5000) NOT NULL DEFAULT '', 
  [ZhaoPian] BLOB, 
  [Version] NVARCHAR(5000) NOT NULL DEFAULT '', 
  [NianLing] NVARCHAR(20) NOT NULL DEFAULT '', 
  [XiuGaiShiJian] NVARCHAR(1000) NOT NULL DEFAULT '', 
  [ChuangJianShiJian] NVARCHAR(100) NOT NULL DEFAULT '');

CREATE VIEW [view_make_guid]
AS
SELECT UPPER (HEX (RANDOMBLOB (4)) || '-' || HEX (RANDOMBLOB (2)) || '-' || HEX (RANDOMBLOB (2)) || '-' || HEX (RANDOMBLOB (2)) || '-' || HEX (RANDOMBLOB (6))) AS [guid];

CREATE VIEW [view_make_sfzh]
AS
SELECT [tem].[num17] || CASE (((UNICODE (SUBSTR ([num17], 1, 1)) - 48) * 7 + (UNICODE (SUBSTR ([num17], 2, 1)) - 48) * 9 + (UNICODE (SUBSTR ([num17], 3, 1)) - 48) * 10 + (UNICODE (SUBSTR ([num17], 4, 1)) - 48) * 5 + (UNICODE (SUBSTR ([num17], 5, 1)) - 48) * 8 + (UNICODE (SUBSTR ([num17], 6, 1)) - 48) * 4 + (UNICODE (SUBSTR ([num17], 7, 1)) - 48) * 2 + (UNICODE (SUBSTR ([num17], 8, 1)) - 48) * 1 + (UNICODE (SUBSTR ([num17], 9, 1)) - 48) * 6 + (UNICODE (SUBSTR ([num17], 10, 1)) - 48) * 3 + (UNICODE (SUBSTR ([num17], 11, 1)) - 48) * 7 + (UNICODE (SUBSTR ([num17], 12, 1)) - 48) * 9 + (UNICODE (SUBSTR ([num17], 13, 1)) - 48) * 10 + (UNICODE (SUBSTR ([num17], 14, 1)) - 48) * 5 + (UNICODE (SUBSTR ([num17], 15, 1)) - 48) * 8 + (UNICODE (SUBSTR ([num17], 16, 1)) - 48) * 4 + (UNICODE (SUBSTR ([num17], 17, 1)) - 48) * 2) % 11) WHEN 0 THEN '1' WHEN 1 THEN '0' WHEN 2 THEN 'X' WHEN 3 THEN '9' WHEN 4 THEN '8' WHEN 5 THEN '7' WHEN 6 THEN '6' WHEN 7 THEN '5' WHEN 8 THEN '4' WHEN 9 THEN '3' ELSE '2' END AS [ShenFenZheng]
FROM   (SELECT '110101' || STRFTIME ('%Y%m%d', DATE ('1965-01-01', PRINTF ('+%d days', ABS (RANDOM () + 1) % (CAST (JULIANDAY ('2005-12-31') - JULIANDAY ('1965-01-01') AS [INTEGER]) + 1)))) || PRINTF ('%03d', ABS (RANDOM () + 1) % 999) AS [num17]) tem;

CREATE INDEX [index_kafamily_sfz] ON [ksjiating]([ShenFenZheng]);

CREATE INDEX [index_ksjianli_paixuid] ON [ksjianli]([PaiXuId]);

CREATE INDEX [index_ksjianli_sfz] ON [ksjianli]([ShenFenZheng]);

CREATE INDEX [index_ksjiating_paixuid] ON [ksjiating]([PaiXuId]);

CREATE INDEX [index_ShenFenZheng] ON [kslist]([ShenFenZheng]);

