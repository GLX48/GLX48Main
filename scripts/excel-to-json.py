import pandas as pd
import json
import os
from datetime import datetime

def excel_to_json(excel_path, json_path):
    # 确保输出目录存在。如果目录不存在，则创建它（包括任何必要的中间目录）。
    os.makedirs(os.path.dirname(json_path), exist_ok=True)  # 新增的关键行
    
    # 读取Excel文件
    try:
        df = pd.read_excel(excel_path)
    except FileNotFoundError:
        print(f"错误：找不到Excel文件 '{excel_path}'，请检查路径是否正确。")
        return
    except Exception as e:
        print(f"读取Excel文件时发生错误：{e}")
        return

    # 转换为字典列表
    data = []
    for _, row in df.iterrows():
        item = {
            'filename': row['filename'],
            'keywords': [kw.strip() for kw in str(row['keywords']).split(',')],
            'text_content': str(row['text_content']),
            'last_updated': datetime.now().isoformat()
        }
        # 添加可选字段
        if 'category' in df.columns:
            item['category'] = row['category']
        if 'song_name' in df.columns:
            item['song_name'] = row['song_name']
            
        data.append(item)
    
    # 保存为JSON
    try:
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"成功将数据从 '{excel_path}' 转换并保存到 '{json_path}'")
    except Exception as e:
        print(f"写入JSON文件时发生错误：{e}")

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.dirname(__file__))
    data_dir = os.path.join(base_dir, 'data')
    
    # 处理单技数据
    excel_to_json(
        os.path.join(data_dir, 'excel', 'single_skill.xlsx'),
        os.path.join(data_dir, 'json', 'single_skill.json')
    )
    
    # 处理Call本数据
    excel_to_json(
        os.path.join(data_dir, 'excel', 'call_book.xlsx'),
        os.path.join(data_dir, 'json', 'call_book.json')
    )