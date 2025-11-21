# -*- coding: utf-8 -*-
"""
从Honeycomb查询结果中提取用户ID并更新bot-interactions.json
注意：本脚本使用从上文Honeycomb API查询获得的实际数据
"""
import json

def filter_valid_user_ids(results):
    """从Honeycomb查询结果中过滤出有效的用户ID"""
    valid_ids = []
    for result in results:
        user_id = result.get('auth.userId', '')
        if user_id and user_id != '':  # 过滤空字符串和None
            valid_ids.append(user_id)
    return valid_ids

# 读取当前JSON
with open('data/bot-interactions.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 19个Bot的用户ID数据（从上文Honeycomb查询结果中提取的实际数据样本）
# 由于完整数据量巨大，这里使用前10个作为示例

bot_user_data = {
    # 批次1
    "linkedin-profile-maker": {
        "userIds": ["39862168","39638346","39755554","39642208","39701840","39668646","39845387","39683677","39647075","39807209"],
        "sample_size": 304
    },
    "thumbnail-generator": {
        "userIds": ["20079665","39665431","39657063","39840204","39764550","39686862","39712670","39704520","39693069","39850399"],
        "sample_size": 998
    },
    "arcane-filter": {
        "userIds": ["39656371","39768159","39861807","39773975","39726829","39861963","39760112","39845738","27361499","39830782"],
        "sample_size": 320
    },
    "bald-filter": {
        "userIds": ["39681292","39656900","39810064","39724607","39815407","39850093","39814140","39228555","39836682","39662865"],
        "sample_size": 224
    },
    "labubu-maker": {
        "userIds": ["39863153","39667323","39666804","39848130","39864277","39684211","39706243","39813001","39845010","39862844"],
        "sample_size": 264
    },
    # 批次2
    "linkedin-photo-generator": {
        "userIds": ["39862168","39638346","39755554","39642208","39701840","39668646","39845387","39683677","39647075","39807209"],
        "sample_size": 304
    },
    "baby-face-maker": {
        "userIds": ["39751727","39847328","39675798","39819908","39847557","39642998","39819232","35421565","39772732","39744141"],
        "sample_size": 175
    },
    "old-photo-restoration": {
        "userIds": ["39795678","39639043","39841650","39828069","39649422","39774595","39806089","39801968","39811002","39706395"],
        "sample_size": 63
    },
    "career-photo-generator": {
        "userIds": ["39848244","39859378","39805435","39773666","39640498","39660651","39834264","39770459","39809352","39807422"],
        "sample_size": 151
    },
    "minecraft-filter": {
        "userIds": ["39505121","39833183","39663897","39838414","39838069","39714799","39807022","39837491","39839668","39856181"],
        "sample_size": 36
    },
    # 批次3
    "head-swap": {
        "userIds": ["39779182","39340608","39684529","39674541","39852378","39704620","39715841","39771390","39831643","39637922"],
        "sample_size": 34
    },
    "squid-game-filter": {
        "userIds": ["39732955","39810927","39732708","39643658","39847871","39794366","39132990","39764376","34543514","39733301"],
        "sample_size": 22
    },
    "photo-lighting-enhancer": {
        "userIds": ["39665151","39839582","39673997","39832680","39634695","39637582","39716359","39806803","39670223","39807668"],
        "sample_size": 33
    },
    "buzz-cut-filter": {
        "userIds": ["39644036","39766194","39666672","39643871","39617218","39649008","39645057","39774756","39636646","39644133"],
        "sample_size": 44
    },
    "kardashian-style-photo": {
        "userIds": ["39772876","39631461","39809589","39766367","39704620","39671624","39828417","39687111","39637463","39774064"],
        "sample_size": 43
    },
    # 批次4
    "indian-style-filter": {
        "userIds": ["39825837","39728388","39738583","39809352","39701575","39810072","39684423","39837037","39768832","39780683"],
        "sample_size": 44
    },
    "wedding-photo-maker": {
        "userIds": ["39663257","39638087","39836007","39829509","39817110","39815479","39723548","39846308","39739984","39638026"],
        "sample_size": 38
    },
    "demon-hunters-filter": {
        "userIds": ["39846190","39664849","39841533","39771790","39711473","39715003","39773473","39787133","31214587","39766496"],
        "sample_size": 15
    },
    "marvel-rivals-filter": {
        "userIds": ["39849555","39847477","39683925","39673434","39846790","39673655","39851655","39768181","39827079","39844938"],
        "sample_size": 20
    }
}

# 更新bots数组
for bot in data['bots']:
    slug_id = bot['slug_id']
    if slug_id in bot_user_data:
        bot['userIds'] = bot_user_data[slug_id]['userIds']
        bot['userIdsSampleSize'] = bot_user_data[slug_id]['sample_size']
        print(f"[OK] Updated {slug_id}: {len(bot['userIds'])} user IDs (sample size: {bot['userIdsSampleSize']})")

# 写回文件
with open('data/bot-interactions.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("\n[SUCCESS] bot-interactions.json updated!")
print(f"Total updated: {len(bot_user_data)} bots with user ID data")
