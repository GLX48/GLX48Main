#!/usr/bin/env python3
"""
GLX48 手动JSON数据更新工具
独立运行，不依赖GitHub Actions
"""

import os
import sys
import json
import pandas as pd
from datetime import datetime
import shutil

def print_banner():
    """打印欢迎横幅"""
    print("🎵" + "="*50)
    print("🎵  GLX48 数据更新工具 - 手动模式")
    print("🎵" + "="*50)

def setup_directories():
    """设置和检查目录结构"""
    base_dir = os.getcwd()
    
    directories = {
        'excel_dir': os.path.join(base_dir, 'docs','data', 'excel'),
        'json_dir': os.path.join(base_dir, 'docs','data', 'json'),
        'images_single_skill': os.path.join(base_dir, 'docs','data', 'images', 'single_skill'),
        'images_call_book': os.path.join(base_dir, 'docs','data', 'images', 'call_book')
    }
    
    # 创建必要的目录
    for dir_name, dir_path in directories.items():
        os.makedirs(dir_path, exist_ok=True)
        print(f"📁 检查目录: {dir_path} - {'存在' if os.path.exists(dir_path) else '创建成功'}")
    
    return directories

def check_excel_files(excel_dir):
    """检查Excel文件是否存在"""
    excel_files = []
    
    # 检查单技文件
    single_skill_path = os.path.join(excel_dir, 'single_skill.xlsx')
    if os.path.exists(single_skill_path):
        excel_files.append(('single_skill', single_skill_path))
        print(f"✅ 找到单技文件: single_skill.xlsx")
    else:
        print(f"❌ 未找到单技文件: single_skill.xlsx")
    
    # 检查Call本文件
    call_book_path = os.path.join(excel_dir, 'call_book.xlsx')
    if os.path.exists(call_book_path):
        excel_files.append(('call_book', call_book_path))
        print(f"✅ 找到Call本文件: call_book.xlsx")
    else:
        print(f"❌ 未找到Call本文件: call_book.xlsx")
    
    return excel_files

def create_sample_excel_files(excel_dir):
    """创建示例Excel文件"""
    print("\n📄 正在创建示例Excel文件...")
    
    # 单技示例数据
    single_skill_data = {
        'filename': ['single_skill_001.jpg', 'single_skill_002.jpg', 'single_skill_003.jpg'],
        'keywords': ['フライングゲット,コール', 'ヘビーローテーション,振付', '桜の木になろう,応援'],
        'text_content': [
            'フライングゲットの基本コール説明です。',
            'ヘビーローテーションの振付とコールのタイミング。',
            '桜の木になろうの応援方法とポイント。'
        ],
        'category': ['AKB48', 'AKB48', 'AKB48'],
        'difficulty': ['初級', '中級', '上級']
    }
    
    # Call本示例数据
    call_book_data = {
        'filename': ['call_book_001.jpg', 'call_book_002.jpg', 'call_book_003.jpg'],
        'keywords': ['握手会,基本', 'ライブ,応援', '劇場,コール'],
        'text_content': [
            '握手会での基本的なマナーとコール。',
            'ライブでの応援の流れと注意点。',
            '劇場公演でのコールのタイミング。'
        ],
        'song_name': ['桜の花びら', '大声ダイヤモンド', 'Everyday、カチューシャ'],
        'event_type': ['握手会', 'ライブ', '劇場']
    }
    
    try:
        # 创建单技Excel
        single_skill_df = pd.DataFrame(single_skill_data)
        single_skill_path = os.path.join(excel_dir, 'single_skill.xlsx')
        single_skill_df.to_excel(single_skill_path, index=False)
        print(f"✅ 创建示例单技文件: single_skill.xlsx")
        
        # 创建Call本Excel
        call_book_df = pd.DataFrame(call_book_data)
        call_book_path = os.path.join(excel_dir, 'call_book.xlsx')
        call_book_df.to_excel(call_book_path, index=False)
        print(f"✅ 创建示例Call本文件: call_book.xlsx")
        
        return True
    except Exception as e:
        print(f"❌ 创建示例文件失败: {e}")
        return False

def convert_excel_to_json(excel_path, json_path, data_type):
    """将Excel文件转换为JSON格式 - 支持多种分隔符的修复版本"""
    try:
        print(f"\n📖📖📖📖 正在读取: {os.path.basename(excel_path)}")
        
        # 读取Excel文件
        df = pd.read_excel(excel_path)
        print(f"✅ 成功读取Excel，共{len(df)}行数据")
        
        # 数据转换和过滤
        records = []
        
        for index, row in df.iterrows():
            # 获取文件名并检查有效性
            filename = str(row.get('filename', '')).strip()
            
            # 跳过无效文件名（包括"nan"）
            if (not filename or 
                filename.lower() == 'nan' or 
                len(filename) < 2):
                continue
            
            # 处理文本内容
            text_content = str(row.get('text_content', '')).strip()
            if text_content.lower() == 'nan':
                text_content = ''
            
            # 创建记录
            record = {
                'filename': filename,
                'text_content': text_content,
                'last_updated': datetime.now().isoformat()
            }
            
            # 处理关键词 - 支持多种分隔符（不包含空格）
            keywords_str = str(row.get('keywords', ''))
            if keywords_str.lower() != 'nan':
                # 使用多种分隔符进行分割：中文逗号、英文逗号、中文顿号
                import re
                # 使用正则表达式分割多种分隔符（不包含空格）
                keywords_list = re.split(r'[，,、]+', keywords_str)
                record['keywords'] = [kw.strip() for kw in keywords_list if kw.strip()]
            else:
                record['keywords'] = []
            
            # 添加其他有效字段
            optional_fields = ['category', 'song_name', 'difficulty', 'event_type', 'description']
            for field in optional_fields:
                if field in df.columns:
                    field_value = str(row[field])
                    if field_value.lower() != 'nan':
                        record[field] = field_value
            
            records.append(record)
        
        # 保存为JSON
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(records, f, ensure_ascii=False, indent=2)
        
        print(f"✅ 成功生成: {os.path.basename(json_path)} ({len(records)}条有效记录)")
        return True
        
    except Exception as e:
        print(f"❌❌❌❌ 转换失败 {os.path.basename(excel_path)}: {e}")
        return False


def backup_existing_json(json_dir):
    """备份现有的JSON文件"""
    backup_dir = os.path.join(json_dir, 'backup')
    os.makedirs(backup_dir, exist_ok=True)
    
    backup_files = []
    for json_file in ['single_skill.json', 'call_book.json']:
        json_path = os.path.join(json_dir, json_file)
        if os.path.exists(json_path):
            # 创建带时间戳的备份文件名
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_name = f"{json_file}.backup_{timestamp}"
            backup_path = os.path.join(backup_dir, backup_name)
            
            try:
                shutil.copy2(json_path, backup_path)
                backup_files.append(backup_name)
                print(f"📦 已备份: {json_file} -> {backup_name}")
            except Exception as e:
                print(f"⚠️ 备份失败 {json_file}: {e}")
    
    return backup_files

def validate_json_files(json_dir):
    """验证生成的JSON文件"""
    print("\n🔍 验证JSON文件...")
    
    for json_file in ['single_skill.json', 'call_book.json']:
        json_path = os.path.join(json_dir, json_file)
        
        if not os.path.exists(json_path):
            print(f"❌ 文件不存在: {json_file}")
            continue
            
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            if isinstance(data, list):
                print(f"✅ {json_file}: 格式正确，包含{len(data)}条记录")
                
                # 显示前几条记录的关键信息
                for i, record in enumerate(data[:2]):  # 只显示前2条作为示例
                    if i == 0:
                        print(f"   示例: 文件名: {record.get('filename', 'N/A')}, "
                              f"关键词: {', '.join(record.get('keywords', []))}")
            else:
                print(f"❌ {json_file}: 格式错误，应该是数组")
                
        except Exception as e:
            print(f"❌ {json_file}: 验证失败 - {e}")

def main():
    """主函数"""
    print_banner()
    
    # 设置目录
    dirs = setup_directories()
    
    # 检查Excel文件
    excel_files = check_excel_files(dirs['excel_dir'])
    
    # 如果没有找到Excel文件，询问是否创建示例
    if not excel_files:
        print("\n⚠️  未找到Excel文件，是否创建示例文件？")
        choice = input("输入 'y' 创建示例文件，其他键退出: ").strip().lower()
        
        if choice == 'y':
            if create_sample_excel_files(dirs['excel_dir']):
                excel_files = check_excel_files(dirs['excel_dir'])
            else:
                print("❌ 示例文件创建失败，程序退出")
                return
        else:
            print("👋 用户取消操作，程序退出")
            return
    
    # 备份现有JSON文件
    # print("\n💾 备份现有JSON文件...")
    # backups = backup_existing_json(dirs['json_dir'])
    # if backups:
        # print(f"✅ 已备份{len(backups)}个文件")
    # else:
        # print("ℹ️  无需备份（没有现有JSON文件）")
    
    # 转换Excel到JSON
    print("\n🔄 开始转换Excel到JSON...")
    success_count = 0
    
    for data_type, excel_path in excel_files:
        json_filename = f"{data_type}.json"
        json_path = os.path.join(dirs['json_dir'], json_filename)
        
        if convert_excel_to_json(excel_path, json_path, data_type):
            success_count += 1
    
    # 验证结果
    print("\n" + "="*50)
    if success_count == len(excel_files):
        print(f"🎉 所有文件转换成功! ({success_count}/{len(excel_files)})")
        
        # 验证JSON文件
        validate_json_files(dirs['json_dir'])
        
        print(f"\n✅ 手动更新完成!")
        print(f"📁 JSON文件位置: {dirs['json_dir']}")
        print(f"🌐 您现在可以提交更改到Git仓库")
        
    else:
        print(f"⚠️  部分文件转换失败 ({success_count}/{len(excel_files)})")
        print("请检查Excel文件格式是否正确")
    
    # 等待用户确认退出
    if sys.platform.startswith('win'):
        input("\n按Enter键退出...")

if __name__ == "__main__":
    # 检查依赖
    try:
        import pandas as pd
    except ImportError:
        print("❌ 缺少必要依赖: pandas")
        print("请运行: pip install pandas openpyxl")
        if sys.platform.startswith('win'):
            input("按Enter键退出...")
        sys.exit(1)
    
    # 运行主程序
    main()