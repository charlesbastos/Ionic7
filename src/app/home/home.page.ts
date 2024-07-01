//import { Component } from '@angular/core';

import { Component, ElementRef, OnInit, ViewChild, input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { AlertController, isPlatform, ToastController } from '@ionic/angular';
import write_blob from 'capacitor-blob-writer';
import { PreviewAnyFile } from '@awesome-cordova-plugins/preview-any-file/ngx';

//  Usado para exemplos da conversão de string para base64
import { Buffer } from "buffer";

const APP_DIRECTORY = Directory.Documents;


@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {

    folderContent : any[] = [];
	currentFolder:string  = '';
	copyFile:any ;
	originalCopyFile: any;
  
	@ViewChild('filepicker') uploader: ElementRef | undefined;

	constructor(
		private route: ActivatedRoute,
		private alertCtrl: AlertController,
		private router: Router,
		private previewAnyFile: PreviewAnyFile,
		private toastCtrl: ToastController
	) {}

	ngOnInit() {
		this.currentFolder = this.route.snapshot.paramMap.get('folder') || '';
		this.loadDocuments();
	}

  async loadDocuments() {
		const folderContent = await Filesystem.readdir({
			directory: APP_DIRECTORY,
			path: this.currentFolder
		});
		console.log("folderContent = " , folderContent );
		// O array do diretório é apenas do tipo strings
		// Será adicionado a informação isFile para facilitar as verificações
		this.folderContent = folderContent.files.map((file) => {
			return {
				name: file.name,
				isFile: file.name.includes('.'),
				uri: file.uri
			};
		});
	}


	async createFolder() {
		let alert = await this.alertCtrl.create({
			header: 'Create folder',
			message: 'Please specify the name of the new folder',
			inputs: [
				{
					name: 'name',
					type: 'text',
					placeholder: 'MyDir'
				}
			],
			buttons: [
				{
					text: 'Cancel',
					role: 'cancel'
				},
				{
					text: 'Create',
					handler: async (data) => {
						await Filesystem.mkdir({
							directory: APP_DIRECTORY,
							path: `${this.currentFolder}/${data.name}`
						});
						this.loadDocuments();
					}
				}
			]
		});

		await alert.present();
	}

	// --------------------------------------------------------------------------
   	//		Fase 1 - Adicionando arquivos com uma entrada padrão  
   	// --------------------------------------------------------------------------
	// 
	/*  Fase 1 - Antes 
	addFile() {}
    async fileSelected($event:any) {}
    */
 
	
	//  Fase 1 - Usar operador ?  em uploader ->> O Encadeamento Opcional pode ser usado 
	//  junto com a Coalescência Nula para fornecer um valor substituto ao lidar com 
	//  valores null ou undefined
	//
	/*   Fase 1 - Depois  */ 
	addFile() {
		// oploader - Abre a janela do SO para selecionar o arquivo
		//   ao clicar no arquivo o async fifeSelected () seleciona o arquivo 
		this.uploader?.nativeElement.click();
		console.log("addFile = " , this.uploader?.nativeElement );
	}

  	async fileSelected($event:any) {
    	const selected = $event.target.files[0];

		await write_blob({
		directory: APP_DIRECTORY,
		path: `${this.currentFolder}/${selected.name}`,
		blob: selected,
		on_fallback(error) {
			console.error('error: ', error);
		}
		});
		
		console.log("fileSelected = " , this.uploader?.nativeElement );

		this.loadDocuments();
	}

   // --------------------------------------------------------------------------
   //		Fase 2 - Navegar por todas as pastas,  
   // --------------------------------------------------------------------------
   /* 
   Para isso, a função itemClicked() deve fazer algumas verificações. 
   A - Somente se a entrada selecionada for um diretório, será anexado esse nome ao nosso caminho atual 
       e então navegar até ele,
	 -  A mesma página será inicializada novamente e carregará os arquivos para esse novo nível:

   // Fase 2 - Antes
   async itemClicked(entry:any) {}
   */

  	/* Fase 2 - Depois   
	async itemClicked(entry:any) {
		if (this.copyFile) {
		  // Código usado na Fase 5 - Copiar arquivo
		} else {
		  // Open the file or folder
		  if (entry.isFile) {
			this.openFile(entry);
		  } else {
			let pathToOpen =
			  this.currentFolder != '' ? this.currentFolder + '/' + entry.name : entry.name;
			let folder = encodeURIComponent(pathToOpen);
			this.router.navigateByUrl(`/home/${folder}`);
		  }
		}
	  }
 	*/


	// --------------------------------------------------------------------------
	//		Fase 3 - Abrir arquivos 
	// --------------------------------------------------------------------------
	/*  
	 A visualização de arquivos é um pouco complicado, pois não funciona em um navegador ( no mode Dev ).
	 Como alternativa, adicionei uma função para baixar o arquivo, mas provavelmente você precisará
	 de um comportamento diferente em seu aplicativo da web (PWA).

	Para plataformas nativas devemos usar o plugin Cordova que instalamos inicialmente. 
	Para encontrar o item certo, precisamos recuperar a URI completa de um arquivo antecipadamente,
	chamando a função Filesystem.getUri(). 
		Com a URI resultante pode ser passado para o plugin.

	//  Fase 3 - Antes
	async openFile(entry:any) {}
	*/

	/*  Fase 3 - Depois   */
	async openFile(entry:any) {
		if (isPlatform('hybrid')) {
		  // Pega a URI e usa no plugin Cordova plugin para fazer um preview
		  const file_uri = await Filesystem.getUri({
			directory: APP_DIRECTORY,
			path: this.currentFolder + '/' + entry.name
		  });
	
		  this.previewAnyFile.preview(file_uri.uri)
			.then((res: any) => console.log(res))
			.catch((error: any) => console.error(error));
		} else {
		  // Browser fallback to download the file
		  const file = await Filesystem.readFile({
			directory: APP_DIRECTORY,
			path: this.currentFolder + '/' + entry.name
		  });

		  // --------------------------------------------------------------------------
		  //		Logs do arquivo selecionado
		  // --------------------------------------------------------------------------
		  /*
		  console.log("path = " , this.currentFolder + '/' + entry.name );
		  console.log("file = " , file );
		  console.log("file.data = " , file.data );
		 */

		  // Converte os dados do arquivo do formato Base64 para Blob
		  const blob = this.b64toBlob(file.data, '');
		  const blobUrl = URL.createObjectURL(blob);
		  //console.log("blob = " , blob );
		  //console.log("blobUrl = " , blobUrl );
		  
		  
		  // --------------------------------------------------------------------------
		  //		Exemplo de convesão de String to Blob
		  // ---------------------------------------------------------------------------
		  //
		  // Define o string de teste
		  /* 
		  var myString = 'Hello World!';
		  console.log("myString = " , myString );
		  
		  // Converte string para base64
		  const myBase64 = Buffer.from(myString).toString('base64')
		  console.log("myBase64 = " , myBase64 );
		  // myString = 'Hello World!' =  myBase64 = "SGVsbG8gV29ybGQh"

		  // Encode the String to Base64
          var encodedStringToBlob = this.b64toBlob(myBase64, '');
		  console.log("encodedStringBlob = " , encodedStringToBlob );
          */

		  //  Faz o download do arquivo
		  let a = document.createElement('a');
		  document.body.appendChild(a);
		  a.setAttribute('style', 'display: none');
		  a.href = blobUrl;
		  a.download = entry.name;
		  a.click();
		  window.URL.revokeObjectURL(blobUrl);
		  a.remove();
		  
		}
	  }
	
	/*  Fase 3 - Continuação - Função para converter b64 para Blob 

	Usar a implementação que encontrei, apenas para converter uma string base64 de volta em 
	um blob:

	// Fase 3 - Antes
	b64toBlob = (b64Data:any, contentType = '', sliceSize = 512) => {};
	*/

	// Fase 3 - Continuação - Depois 
	// Helper for browser download fallback
	// https://betterprogramming.pub/convert-a-base64-url-to-image-file-in-angular-4-5796a19fdc21
	//
	// Converte os dados do arquivo de Base64 para Blob

	b64toBlob = (b64Data: any, contentType = '', sliceSize = 512) => {
		const byteCharacters = atob(b64Data);
		const byteArrays = [];

		for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
			const slice = byteCharacters.slice(offset, offset + sliceSize);

			const byteNumbers = new Array(slice.length);
			for (let i = 0; i < slice.length; i++) {
				byteNumbers[i] = slice.charCodeAt(i);
			}

			const byteArray = new Uint8Array(byteNumbers);
			byteArrays.push(byteArray);
		}
		const blob = new Blob(byteArrays, { type: contentType });
		return blob;
	};

	// --------------------------------------------------------------------------
	//		Fase 4 - DELETAR arquivos  
	// --------------------------------------------------------------------------
	/*  
	Para excluir um arquivo ou pasta, basta chamar a função correspondente no sistema de arquivos
	com o caminho para o arquivo ou pasta e ele será removido. 
	Ao passar a recursiveflag para exclusão de uma pasta também podemos excluir diretamente 
	todo o conteúdo dessa pasta. CUIDADO!!!

	//  Fase 4 - Antes     
	async delete(entry:any) {}
    */

	/*  Fase 4 - Depois   */
	async delete(entry:any) {
		if (entry.isFile) {
		await Filesystem.deleteFile({
			directory: APP_DIRECTORY,
			path: this.currentFolder + '/' + entry.name
		});
		} else {
		await Filesystem.rmdir({
			directory: APP_DIRECTORY,
			path: this.currentFolder + '/' + entry.name,
			recursive: true // Removes all files as well!
		});
		}
		this.loadDocuments();
    }

	// --------------------------------------------------------------------------
	//		Fase 5 - COPIAR arquivos  
	// --------------------------------------------------------------------------
	/*  
	Para copiar um arquivo precisamos de duas etapas. 
	-  Primeiro, acionamos a ação de cópia em um arquivo/diretório e definimos nosso copyFile 
	   para esse item, o que basicamente habilita a ação de cópia.

	-  Segundo clique, podemos agora selecionar uma pasta e então a nossa função finishCopyFile()
	   será chamada.

	   Também filtraremos os arquivos no segundo clique, pois isso não fará sentido.

	//  Fase 5 - Antes  
	startCopy(file:any) {}

	async finishCopyFile(entry:any) {}
	*/

	/*  Fase 5 - Depois  */

	startCopy(file:any) {
		// Armazena o nome do arquivo selecionado na <input> tag
		this.copyFile = file;
		this.originalCopyFile = file;
		//  Emite mensagem para o usuário selecionar como/onde copiar
		console.log("sartCopy  copyFile = " , this.copyFile , "\n originalCopyFile = ", this.originalCopyFile);
		this.copiarArquivo(this.copyFile);
	}
	editName(file:any) {
		// Armazena o nome do arquivo selecionado na <input> tag
		this.copyFile = file;
		this.originalCopyFile = file;
		//  Emite mensagem para o usuário selecionar como/onde copiar
		console.log("sartCopy  copyFile = " , this.copyFile , "\n originalCopyFile = ", this.originalCopyFile);
		this.fazerEdicao(this.copyFile);
	}
	
	async finishCopyFile(entry:any) {
		// entry:any --> vem de itemClicked(entry:any) 
		//				 entry.name 	--> nome da pasta ou arquivo clicado
		//    			 entry.isFile 	--> boollean 
		//				 entry.uri  	--> uri da pasta ou arquivo

		// Tenha certeza que não tem espaços adicionais slash no seu path	
		// OBS.: O correntFolder da raiz é vazio '' isso é APP_DIRECTORY = DOCUMENTS
		const current = this.currentFolder != '' ? `/${this.currentFolder}` : ''

		// URI do arquivo fonte
		const from_uri = await Filesystem.getUri({
		  directory: APP_DIRECTORY,
		  path: `${current}/${this.originalCopyFile.name}`
		});
		// URI do arquivo de destino ORIGATÓRIO em outra pasta
		const dest_uri = await Filesystem.getUri({
		  directory: APP_DIRECTORY,
		  path: `${current}/${entry.name}/${this.copyFile.name}`
		});
		
		await Filesystem.copy({
			directory: APP_DIRECTORY,
			from: `${current}/${this.originalCopyFile.name}`,
			to: `${current}/${entry.name}/${this.copyFile.name}`
		});
		
		this.copyFile = null;
		this.originalCopyFile = null;
		this.loadDocuments();
	}
 	//*/

	//
	//  Comentar a função itemClicked no início - Fase 2 
	//
	/* 
	async itemClicked(entry:any) {
		if (this.copyFile) {
		  // O app inicialmente só pode copiar o arquivo selecionado para uma pasta.
		  // Se for um arquivo emitir uma mensagem
		  if (entry.isFile) {
			let toast = await this.toastCtrl.create({
			  message: 'Selecione uma pasta para copiar o arquivo',
			  duration: 1500
			});
			await toast.present();
			return;
		  }
		  // Finalizar a operação de coiar arquivo
		  this.finishCopyFile(entry);
	
		} else {
		  // Abrir o arquivo ou pasta 
		  if (entry.isFile) {
			this.openFile(entry);
		  } else {
			let pathToOpen =
			  this.currentFolder != '' ? this.currentFolder + '/' + entry.name : entry.name;
			let folder = encodeURIComponent(pathToOpen);
			this.router.navigateByUrl(`/home/${folder}`);
		  }
		}
	  }
 	  */

	// --------------------------------------------------------------------------
	//		Fase 6 - COPIAR arquivos e alterar o nome  
	// --------------------------------------------------------------------------
	/*  
	Para copiar um arquivo precisamos de duas etapas. 
	-  Primeiro, acionamos a ação de cópia em um arquivo/diretório e definimos nosso copyFile 
	   para esse item, o que basicamente habilita a ação de cópia.

	-  Segundo clique, podemos agora selecionar uma pasta e então a nossa função finishCopyFile()
	   será chamada.

	   Também filtraremos os arquivos no segundo clique, pois isso não fará sentido.

	//  Fase 6 - Antes  
	startCopy(file:any) {}

	async finishCopyFile(entry:any) {}
	*/

	/*  Fase 6 - Depois  */


	//
	//  Comentar a função itemClicked no início da - Fase 6 
	//
	/*  console.log("itemClicked = " , this.copyFile ); 
	*/
	
	async itemClicked(entry:any) {
		// Se copyFile é NÃO null ?? 
		//  --> Somente quando for selecionado o botão de <ion-item-sliding> Copy() ou Delete()
		//      a variãvel não é null e o usuário pode clicar na pasta para copiar o arquivo, 
		//      se clicar num arquivo emite um toast
		//console.log("itemClicked ", entry, "\nname = " , entry.name, " uri = " , entry.uri );
		if (this.copyFile) {
		  if (entry.isFile) {
			let toast = await this.toastCtrl.create({
			  message: 'Selecione uma pasta para copiar o arquivo',
			  duration: 1500
			});
			await toast.present();
	
			return; // Sai da função sem fazer a cópia - Clicar novamente
		  }
		  // Se for uma pasta --> Finalizar a operação de coiar arquivo
		  this.finishCopyFile(entry);
	
		} else {
		  // Se for arquivo   --> Faz o DOWNLOAD do arquivo
		  // Se for uma pasta --> Abrir a pasta 
		  if (entry.isFile) {
			this.fazerDownload(entry);
		  } else {
			let pathToOpen =
			  this.currentFolder != '' ? this.currentFolder + '/' + entry.name : entry.name;
			let folder = encodeURIComponent(pathToOpen);
			this.router.navigateByUrl(`/home/${folder}`);
		  }
		}
	  }

	
/*   */
	// Alerta / mensagem - Fazer uma Cópia do arquivo
	//	1 - Cancel
	//  2 - Seleciar PASTA
	//	3 - MESMA pasta
	async copiarArquivo(myVar:any) {
		const currentPath = this.currentFolder != '' ? `/${this.currentFolder}` : '';
		let alert = await this.alertCtrl.create({
			header: 'Fazer uma Copiar',
			message: 'Editar o nome do NOVO arquivo',
			inputs: [
				{
					name: 'name',
					type: 'text',
					placeholder: myVar.name,
					value: `${"Copy_"}${myVar.name}`
				}
			],
			buttons: [
				{
					text: 'Cancel',
					role: 'cancel',
					handler: () => {
						this.copyFile = null;
						this.originalCopyFile = null;
						this.loadDocuments();
					}
				},
				{
					// Vai continuar no método itemClicked
					text: 'Seleciar PASTA',
					handler: async (data) => {
						this.copyFile = data;
					}
				},
				{
					text: 'MESMA  pasta',
					handler: 	async (data) => {
						// Tenha certeza de não ter qualquer corte (slash) em seu path
						// const current = this.currentFolder != '' ? `/${this.currentFolder}` : ''
						// URI do arquivo fonte 
						//   SOMENTE na pasta principal APP_DIRECTORY = DOCUMENTS

						const fromPath = currentPath != '' ? `${currentPath}/${this.copyFile.name}` : `${this.copyFile.name}` ;
						const toPath = currentPath != '' ? `${currentPath}/${data.name}` : `${data.name}` ;
						await Filesystem.copy({
							from: fromPath,  
							directory: APP_DIRECTORY,
							to: toPath,
							toDirectory: APP_DIRECTORY
						});
	
						this.copyFile = null;
						this.originalCopyFile = null;
						this.loadDocuments();
					}
				}
			]
		});

		await alert.present();
	}

	// Alerta / mensagem - Deseja fazer Download
	async fazerDownload(myVar:any) {
		let alert = await this.alertCtrl.create({
			header: 'Fazer Download do arquivo?',
			message: myVar.name,
			buttons: [
				{
					text: 'Cancel',
					role: 'cancel',
					handler: () => {
						this.copyFile = null;
						this.originalCopyFile = null;
						this.loadDocuments();
					}
				},
				{
					text: 'Sim',
					handler: async () => {
						this.openFile(myVar);
					}
				}
			]
		});

		await alert.present();
	}

	// Alerta / mensagem - Deseja fazer Download
	async fazerEdicao(myVar:any) {
		const currentPath = this.currentFolder != '' ? `/${this.currentFolder}` : '';
		let alert = await this.alertCtrl.create({
			header: 'Editar o nome.',
			inputs: [
				{
					name: 'name',
					type: 'text',
					placeholder: myVar.name,
					value: `${"New_"}${myVar.name}`
				}
			],
			buttons: [
				{
					text: 'Cancel',
					role: 'cancel',
					handler: () => {
						this.copyFile = null;
						this.originalCopyFile = null;
						this.loadDocuments();
					}
				},
				{
					text: 'Salvar Edição.',
					handler: async (data) => {
						//console.log("fazerEdicao data", data, "\nname = " , data.name, " uri = " , data.uri );
						//console.log("fazerEdicao copyFile.name = " , this.copyFile.name, "\n originalCopyFile = " , this.originalCopyFile.name );
						const fromPath = currentPath != '' ? `${currentPath}/${this.copyFile.name}` : `${this.copyFile.name}` ;
						const toPath = currentPath != '' ? `${currentPath}/${data.name}` : `${data.name}` ;
						await Filesystem.copy({
							from: fromPath,  
							directory: APP_DIRECTORY,
							to: toPath,
							toDirectory: APP_DIRECTORY
						});
						this.delete(this.copyFile);
						this.copyFile = null;
						this.originalCopyFile = null;
						this.loadDocuments();
					}
				}
			]
		});

		await alert.present();
	}

	// Função usada para Teste de ionic 7 
	teste(){
		alert("So teste");
	}

} // Fim da classe home.page
