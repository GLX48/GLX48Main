import pandas as pd
import json
import os
from datetime import datetime

def excel_to_json(excel_path, json_path):
    # 读取Excel文件
    df = pd.read_excel(excel_path)
    
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
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

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