import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

import { NgDataService } from '../../../shared/services/ng-data.service';
import { NgWord } from '../../../shared/classes/ng-word';

/**
 * NG Word Setting Component
 */
@Component({
  selector: 'app-ng-word-setting',
  templateUrl: './ng-word-setting.component.html',
  styleUrls: ['./ng-word-setting.component.scss']
})
export class NgWordSettingComponent implements OnInit {
  /** 追加欄 */
  public newForm: FormGroup;
  /** NG ワード一覧 */
  public ngWords: NgWord[] = [];
  /** フィードバックメッセージ */
  public message: string = '';
  
  /**
   * コンストラクタ
   * 
   * @param formBuilder Formbuilder
   * @param ngDataService NgDataService
   */
  constructor(
    private formBuilder: FormBuilder,
    private ngDataService: NgDataService
  ) { }
  
  /**
   * 画面初期表示時の処理
   */
  public ngOnInit(): void {
    // フォームを生成する
    this.newForm = this.formBuilder.group({
      word: ['', [Validators.required]]
    });
    
    // NG ワード一覧をキャッシュから取得する
    this.ngDataService.findNgWords()
      .then((ngWords) => {
        this.ngWords = ngWords;
      });
  }
  
  /**
   * NG ワードを追加する
   */
  public onAddNgWord(): void {
    const newWord = this.newForm.value.word;
    
    if(this.ngWords.some((ngWord) => {
      return ngWord.word === newWord;
    })) {
      this.message = `${newWord} は登録済です。`;
      this.newForm.reset();
      return;
    }
    
    // サービス内で ngWords の要素を追加している・参照渡しで利用している画面側では操作不要
    this.ngDataService.addNgWord(newWord)
      .then(() => {
        this.newForm.reset();
      })
      .catch((error) => {
        console.error('NG ワード追加に失敗', error);
        this.message = `NG ワード追加に失敗 : ${JSON.stringify(error)}`;
      });
  }
  
  /**
   * NG ワードを削除する
   * 
   * @param ngWordId 削除する NG ワードの ID
   */
  public onRemoveNgWord(ngWordId: string|number): void {
    // サービス内で ngWords の要素を削除している・参照渡しで利用している画面側では操作不要
    this.ngDataService.removeNgWord(ngWordId)
      .catch((error) => {
        console.error('NG ワード削除に失敗', error);
        this.message = `NG ワード削除に失敗 : ${JSON.stringify(error)}`;
      });
  }
}